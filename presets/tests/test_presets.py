"""Tests for presets. Run: python3 -m unittest discover -s presets/tests"""

import base64
import contextlib
import http.server
import json
import os
import re
import sys
import tempfile
import threading
import unittest
import xml.etree.ElementTree as ET
import zipfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import presets as p2x  # noqa: E402

polarr = p2x.sources.polarr  # the module that actually reads these constants

CRS = "http://ns.adobe.com/camera-raw-settings/1.0/"
SAMPLES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")
REAL_FILTER = json.load(open(os.path.join(SAMPLES, "cf6-real.json"), encoding="utf-8"))
COMPACT = {"name": "QR Look", "state": {"contrast": 0.2, "saturation": -0.1},
           "comments": {"local_adjustments": []}}


def convert_one(obj, name="t.json", group=""):
    preset = p2x.parse_presets(obj, name)[0]
    xmp, _warnings = p2x.build_xmp(preset, group=group)
    return preset, xmp


def fields_of(obj):
    preset, _xmp = convert_one(obj)
    return p2x.build_lightroom(preset)[0]


class TestKeys(unittest.TestCase):
    def test_snake_case_passthrough(self):
        self.assertEqual(p2x.norm_key("hue_red"), "hue_red")

    def test_camel_case_split(self):
        self.assertEqual(p2x.norm_key("LuminanceDenoise"), "luminance_denoise")
        self.assertEqual(p2x.norm_key("GrainAmount"), "grain_amount")

    def test_punctuation_and_spaces(self):
        self.assertEqual(p2x.norm_key("Expo sure"), "expo_sure")
        self.assertEqual(p2x.norm_key("Hue-Red"), "hue_red")

    def test_alias(self):
        self.assertEqual(p2x.norm_key("temp"), "temperature")
        self.assertEqual(p2x.norm_key("Sharpness"), "sharpen")
        self.assertEqual(p2x.norm_key("grain"), "grain_amount")

    def test_local_subtree_detection(self):
        self.assertTrue(p2x.is_local_key("local_adjustments"))
        self.assertTrue(p2x.is_local_key("masks"))
        self.assertFalse(p2x.is_local_key("contrast"))


class TestScaling(unittest.TestCase):
    def test_normalised_passthrough(self):
        self.assertAlmostEqual(p2x._norm(0.42), 0.42)

    def test_percent_input(self):
        self.assertAlmostEqual(p2x._norm(-42), -0.42)

    def test_clamped(self):
        self.assertEqual(p2x._norm(500), 1.0)
        self.assertAlmostEqual(p2x._norm(5), 0.05)

    def test_bipolar(self):
        _name, value = p2x._lr_value(0.18, p2x.SPEC["contrast"])
        self.assertEqual(value, 18)

    def test_bipolar_from_percent(self):
        _name, value = p2x._lr_value(-30.0, p2x.SPEC["highlights"])
        self.assertEqual(value, -30)

    def test_exposure(self):
        _name, value = p2x._lr_value(0.12, p2x.SPEC["exposure"])
        self.assertEqual(value, 0.24)

    def test_temperature(self):
        _name, value = p2x._lr_value(0.22, p2x.SPEC["temperature"])
        self.assertEqual(value, 6270)

    def test_temperature_below_neutral(self):
        _name, value = p2x._lr_value(-0.5, p2x.SPEC["temperature"])
        self.assertEqual(value, 3750)

    def test_tint(self):
        _name, value = p2x._lr_value(0.4, p2x.SPEC["tint"])
        self.assertEqual(value, 40)

    def test_hue_degrees(self):
        _name, value = p2x._lr_value(0.12, p2x.SPEC["highlights_hue"])
        self.assertEqual(value, 43)

    def test_hue_already_degrees(self):
        _name, value = p2x._lr_value(200, p2x.SPEC["shadows_hue"])
        self.assertEqual(value, 200)

    def test_unipolar(self):
        _name, value = p2x._lr_value(0.25, p2x.SPEC["grain_amount"])
        self.assertEqual(value, 25)

    def test_unipolar_clamps_negative(self):
        _name, value = p2x._lr_value(-0.25, p2x.SPEC["sharpen"])
        self.assertEqual(value, 0)


class TestPresetParsing(unittest.TestCase):
    def test_nested_adjustments(self):
        preset = p2x.parse_presets(
            {"name": "A", "adjustments": {"exposure": 0.1, "hue_red": 0.2}}, "a.json")[0]
        self.assertEqual(preset.name, "A")
        self.assertEqual(preset.values["exposure"], 0.1)
        self.assertIn("hue_red", preset.values)

    def test_flat_camel_case(self):
        preset = p2x.parse_presets({"FilterName": "B", "Exposure": -6, "GrainAmount": 18}, "b.json")[0]
        self.assertEqual(preset.name, "B")
        self.assertEqual(preset.values["grain_amount"], 18.0)

    def test_local_adjustments_do_not_leak(self):
        preset = p2x.parse_presets({
            "name": "C",
            "adjustments": {"exposure": -0.1},
            "local_adjustments": [{"exposure": 0.9, "mask": "radial"}],
        }, "c.json")[0]
        self.assertEqual(preset.values["exposure"], -0.1)

    def test_pack_list(self):
        presets = p2x.parse_presets([{"name": "One", "adjustments": {"contrast": 5}},
                                     {"name": "Two", "adjustments": {"contrast": 6}}], "pack.json")
        self.assertEqual([p.name for p in presets], ["One", "Two"])

    def test_pack_dict_presets_key(self):
        presets = p2x.parse_presets({"presets": [{"name": "P", "adjustments": {"contrast": 5}}]}, "x.json")
        self.assertEqual(len(presets), 1)

    def test_pack_filters_key(self):
        presets = p2x.parse_presets({"filters": [{"name": "F", "adjustments": {"contrast": 5}}]}, "x.json")
        self.assertEqual(presets[0].name, "F")

    def test_name_falls_back_to_filename(self):
        preset = p2x.parse_presets({"adjustments": {"contrast": 5}}, "my-look.json")[0]
        self.assertEqual(preset.name, "my-look")

    def test_grayscale_flag(self):
        fields = fields_of({"name": "BW", "adjustments": {"convertToGrayscale": True, "contrast": 10}})
        self.assertEqual(fields["ConvertToGrayscale"], "True")

    def test_lut_noted(self):
        preset = p2x.parse_presets(
            {"name": "L", "adjustments": {"contrast": 5}, "lut": "x.cube"}, "l.json")[0]
        _xmp, warnings = p2x.build_xmp(preset)
        self.assertTrue(any("lut" in w.lower() for w in warnings))

    def test_empty_preset_raises(self):
        with self.assertRaises(ValueError):
            p2x.parse_presets({"name": "nothing here"}, "n.json")


class TestCurves(unittest.TestCase):
    def test_simple_list_of_pairs(self):
        preset = p2x.parse_presets(
            {"name": "curvy", "adjustments": {"contrast": 1},
             "curve": [[0, 0], [0.5, 0.4], [1, 1]]}, "c.json")[0]
        pts = preset.curves["rgb"]
        self.assertEqual(len(pts), 3)
        self.assertEqual(pts[1], (127.5, 102.0))

    def test_nested_channels(self):
        preset = p2x.parse_presets(
            {"name": "c2", "adjustments": {"contrast": 1},
             "curves": {"rgb": [[0, 0], [1, 1]], "blue": [[0, 0.04], [1, 0.96]]}}, "c.json")[0]
        self.assertIn("rgb", preset.curves)
        self.assertAlmostEqual(preset.curves["blue"][1][1], 244.8)

    def test_points_dict_already_255(self):
        preset = p2x.parse_presets(
            {"name": "c3", "adjustments": {"contrast": 1},
             "curve": {"points": [[0, 0], [128, 120], [255, 255]]}}, "c.json")[0]
        self.assertEqual(preset.curves["rgb"][1], (128.0, 120.0))

    def test_sorted_output(self):
        preset = p2x.parse_presets(
            {"name": "c4", "adjustments": {"contrast": 1},
             "curve": [[1, 1], [0, 0], [0.5, 0.6]]}, "c.json")[0]
        xs = [x for x, _ in preset.curves["rgb"]]
        self.assertEqual(xs, sorted(xs))

    def test_no_curve_means_linear(self):
        fields = fields_of({"name": "none", "adjustments": {"contrast": 4}})
        self.assertEqual(fields["ToneCurveName2012"], "Linear")

    def test_curve_marks_custom(self):
        fields = fields_of({"name": "has", "adjustments": {"contrast": 4},
                            "curve": [[0, 0], [1, 1]]})
        self.assertEqual(fields["ToneCurveName2012"], "Custom")


class TestXmp(unittest.TestCase):
    def test_well_formed(self):
        _preset, xmp = convert_one({"name": "Basic", "adjustments": {"exposure": 0.1}})
        root = ET.fromstring(xmp.split("\n", 1)[1].rsplit("<?xpacket", 1)[0])
        self.assertTrue(root.tag.endswith("xmpmeta"))

    def test_required_fields(self):
        _preset, xmp = convert_one({"name": "Basic", "adjustments": {"exposure": 0.1}})
        self.assertIn('crs:PresetType="Normal"', xmp)
        self.assertIn('crs:HasSettings="True"', xmp)
        self.assertIn('crs:ProcessVersion="15.4"', xmp)

    def test_uuid_is_32_hex(self):
        _preset, xmp = convert_one({"name": "Basic", "adjustments": {"exposure": 0.1}})
        uid = re.search(r'crs:UUID="([^"]+)"', xmp).group(1)
        self.assertRegex(uid, r"^[0-9A-F]{32}$")

    def test_name_escaping(self):
        _preset, xmp = convert_one({"name": "Rock & Roll <2026>", "adjustments": {"contrast": 3}})
        self.assertIn("Rock &amp; Roll &lt;2026&gt;", xmp)
        self.assertNotIn("<2026>", xmp)

    def test_white_balance_custom(self):
        fields = fields_of({"name": "wb", "adjustments": {"temperature": 0.2}})
        self.assertEqual(fields["WhiteBalance"], "Custom")
        self.assertIn("Temperature", fields)
        self.assertIn("Tint", fields)

    def test_white_balance_as_shot_when_untouched(self):
        fields = fields_of({"name": "wb2", "adjustments": {"contrast": 3}})
        self.assertEqual(fields["WhiteBalance"], "As Shot")
        self.assertNotIn("Temperature", fields)

    def test_hsl_fields_present(self):
        fields = fields_of({"name": "hsl", "adjustments": {"saturation_blue": 0.3}})
        self.assertEqual(fields["SaturationAdjustmentBlue"], 30)
        self.assertEqual(fields["HueAdjustmentRed"], 0)

    def test_colour_grading_only_when_used(self):
        fields = fields_of({"name": "cg", "adjustments": {"contrast": 1}})
        self.assertNotIn("ColorGradeShadowHue", fields)
        fields2 = fields_of({"name": "cg2", "adjustments": {"shadows_hue": 0.5}})
        self.assertEqual(fields2["ColorGradeShadowHue"], 180)

    def test_vignette_and_grain(self):
        fields = fields_of({"name": "fx", "adjustments": {
            "vignette": -0.3, "grain_amount": 0.25, "grain_size": 0.4}})
        self.assertEqual(fields["PostCropVignetteAmount"], -30)
        self.assertEqual(fields["GrainAmount"], 25)
        self.assertEqual(fields["GrainSize"], 40)

    def test_sign_formatting(self):
        self.assertEqual(p2x.fmt_value(18), "+18")
        self.assertEqual(p2x.fmt_value(-100), "-100")
        self.assertEqual(p2x.fmt_value(0), "0")
        self.assertEqual(p2x.fmt_value(0.24), "+0.24")


class TestFiles(unittest.TestCase):
    def test_safe_filename(self):
        self.assertEqual(p2x.safe_filename('a/b:c*?"<>|'), "abc")
        self.assertEqual(p2x.safe_filename("   "), "preset")
        self.assertEqual(p2x.safe_filename("My Look."), "My Look")

    def test_unique_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            first = p2x.unique_path(tmp, "X")
            open(first, "w").close()
            second = p2x.unique_path(tmp, "X")
            self.assertNotEqual(first, second)
            self.assertTrue(second.endswith("X 2.xmp"))

    def test_base64_filter_code(self):
        payload = {"name": "Coded", "adjustments": {"contrast": 0.2}}
        code = base64.b64encode(json.dumps(payload).encode()).decode()
        obj = p2x.load_json(code)
        self.assertEqual(obj["name"], "Coded")

    def test_convert_folder_and_zip_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = os.path.join(tmp, "src")
            os.makedirs(src)
            with open(os.path.join(src, "a.json"), "w") as fh:
                json.dump({"name": "From Folder", "adjustments": {"contrast": 0.1}}, fh)
            with zipfile.ZipFile(os.path.join(src, "b.zip"), "w") as zf:
                zf.writestr("inner.json",
                            json.dumps({"name": "From Zip", "adjustments": {"contrast": 0.2}}))
            out = os.path.join(tmp, "out")
            written = p2x.convert([src], out)
            names = sorted(os.path.basename(p) for p, _a, _b in written)
            self.assertEqual(names, ["From Folder.xmp", "From Zip.xmp"])
            for path, _a, _b in written:
                self.assertTrue(os.path.getsize(path) > 500)

    def test_cli_end_to_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = os.path.join(tmp, "p.json")
            json.dump({"name": "CLI Preset", "adjustments": {"exposure": 0.1}}, open(src, "w"))
            out = os.path.join(tmp, "out")
            zip_path = os.path.join(tmp, "presets.zip")
            rc = p2x.main([src, "-o", out, "-z", zip_path, "-g", "Polarr"])
            self.assertEqual(rc, 0)
            self.assertTrue(os.path.exists(os.path.join(out, "CLI Preset.xmp")))
            with zipfile.ZipFile(zip_path) as zf:
                self.assertIn("CLI Preset.xmp", zf.namelist())

    def test_group_written(self):
        _preset, xmp = convert_one({"name": "G", "adjustments": {"contrast": 1}}, group="Polarr")
        self.assertIn(">Polarr</rdf:li>", xmp)




# ---------------------------------------------------------------------------
# polarr qr codes, share links and the scan endpoint (served locally, no net)
# ---------------------------------------------------------------------------

class _FixtureHandler(http.server.BaseHTTPRequestHandler):
    routes = {}

    def do_GET(self):  # noqa: N802
        item = self.routes.get(self.path)
        if item is None:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"{}")
            return
        ctype, body = item
        payload = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *_args):
        pass


@contextlib.contextmanager
def local_server(routes):
    handler = type("FixtureHandler", (_FixtureHandler,), {"routes": routes})
    server = http.server.HTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        thread.join(timeout=5)


@contextlib.contextmanager
def fake_polarr(routes):
    """Point the polarr scan endpoint and polarr host check at a local server."""
    with local_server(routes) as base:
        saved_scopes = (polarr.SCAN_BASES, polarr.POLARR_HOSTS)
        polarr.SCAN_BASES = (base + "/v1",)
        polarr.POLARR_HOSTS = ("127.0.0.1",)
        try:
            yield base
        finally:
            polarr.SCAN_BASES, polarr.POLARR_HOSTS = saved_scopes


def scan_routes(base_ref, filter_obj=None):
    """Routes mimicking /v1/ppe/filters/<id>/scan plus the content json."""
    return {
        "/v1/ppe/filters/1400644/scan": ("application/json", json.dumps(
            {"contentUrl": base_ref["base"] + "/content/cf6.json", "name": "CF6", "version": None})),
        "/content/cf6.json": ("application/json", json.dumps(filter_obj or REAL_FILTER)),
    }


class TestFilterLinks(unittest.TestCase):
    def test_id_from_share_url(self):
        self.assertEqual(
            p2x.filter_id_from_url("https://www.polarr.co/users/custom_filter/1400644"), "1400644")

    def test_id_from_trailing_slash(self):
        self.assertEqual(p2x.filter_id_from_url("https://photoeditor.polarr.co/filter/abc12345/"),
                         "abc12345")

    def test_id_from_query(self):
        self.assertEqual(p2x.filter_id_from_url("https://www.polarr.co/f?filter=1400644"), "1400644")

    def test_id_from_json_suffix(self):
        self.assertEqual(p2x.filter_id_from_url("https://x.co/a/look.json"), "look")

    def test_fetch_by_id(self):
        holder = {}
        with local_server({}) as base:
            holder["base"] = base
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            saved = (polarr.SCAN_BASES,)
            polarr.SCAN_BASES = (base + "/v1",)
            try:
                got = p2x.fetch_filter_by_id("1400644")
            finally:
                (polarr.SCAN_BASES,) = saved
        self.assertEqual(got["name"]["en"], "CF6")
        self.assertAlmostEqual(got["state"]["contrast"], 0.17838815789473683)

    def test_share_url_resolves_through_scan(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes) as fake_base:
                got = p2x.fetch_filter_url(f"{fake_base}/users/custom_filter/1400644")
        self.assertEqual(got["name"]["en"], "CF6")

    def test_page_with_embedded_filter_json(self):
        page = ("<html><head><title>x</title></head><body><script>"
                "window.__FILTER__ = " + json.dumps(COMPACT) + ";</script></body></html>")
        routes = {"/look": ("text/html", page)}
        with local_server(routes) as base:
            got = p2x.fetch_filter_url(base + "/look")
        self.assertEqual(got["name"], "QR Look")

    def test_scan_response_url_is_unwrapped(self):
        routes = {"/scan.json": ("application/json", json.dumps(
            {"contentUrl": None}))}
        with local_server(routes) as base:
            routes["/content.json"] = ("application/json", json.dumps(COMPACT))
            routes["/scan.json"] = ("application/json", json.dumps({"contentUrl": base + "/content.json"}))
            got = p2x.fetch_filter_url(base + "/scan.json")
        self.assertEqual(got["name"], "QR Look")

    def test_non_polarr_page_without_data_raises(self):
        routes = {"/nothing": ("text/html", "<html><body>hello</body></html>")}
        with local_server(routes) as base:
            with self.assertRaises(ValueError):
                p2x.fetch_filter_url(base + "/nothing")

    def test_bare_id_loads_filter(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes):
                obj = p2x.load_json("1400644")
        self.assertEqual(obj["id"], "BJdPECmfW")

    def test_real_share_urls_are_polarr_hosts(self):
        self.assertTrue(polarr._is_polarr_host("www.polarr.co"))
        self.assertTrue(polarr._is_polarr_host("api.polaxiong.com"))
        self.assertFalse(polarr._is_polarr_host("notpolarr.co"))
        self.assertFalse(polarr._is_polarr_host("evilpolarr.co"))


class TestQrImages(unittest.TestCase):
    def setUp(self):
        try:
            import cv2  # noqa: F401
            import segno  # noqa: F401
        except ImportError:
            self.skipTest("opencv and segno are needed for QR tests")

    def _qr(self, text, name="qr.png"):
        import segno
        tmp = tempfile.mkdtemp()
        path = os.path.join(tmp, name)
        segno.make(text, error="m").save(path, scale=8, border=4)
        return path

    def test_qr_holding_json(self):
        path = self._qr(json.dumps(COMPACT))
        obj = p2x.load_json(path)
        self.assertEqual(obj["name"], "QR Look")

    def test_qr_holding_share_url(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes) as fake_base:
                path = self._qr(fake_base + "/users/custom_filter/1400644")
                obj = p2x.load_json(path)
        self.assertEqual(obj["name"]["en"], "CF6")

    def test_qr_end_to_end_to_xmp(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes):
                path = self._qr(json.dumps({"name": "From Qr",
                                            "state": {"contrast": 0.25, "exposure": 0.1}}))
                preset = p2x.parse_presets(p2x.load_json(path), "qr.png")[0]
                xmp, _warnings = p2x.build_xmp(preset)
        self.assertIn('crs:Contrast2012="+25"', xmp)
        self.assertIn('crs:Exposure2012="+0.20"', xmp)
        self.assertIn(">From Qr</rdf:li>", xmp)

    def test_image_without_qr_raises(self):
        from PIL import Image  # noqa: F401  (only to make a blank png)
        tmp = tempfile.mkdtemp()
        path = os.path.join(tmp, "blank.png")
        Image.new("RGB", (200, 200), "white").save(path)
        with self.assertRaises(ValueError):
            p2x.load_json(path)


class TestRealPolarrSample(unittest.TestCase):
    def test_real_filter_converts(self):
        obj = p2x.load_json(os.path.join(SAMPLES, "cf6-real.json"))
        preset = p2x.parse_presets(obj, "cf6-real.json")[0]
        self.assertEqual(preset.name, "CF6")
        fields, _warnings = p2x.build_lightroom(preset)
        self.assertEqual(fields["Contrast2012"], 18)
        self.assertEqual(fields["Shadows2012"], 36)
        self.assertEqual(fields["Blacks2012"], -30)
        self.assertEqual(fields["Saturation"], -22)
        self.assertEqual(fields["HueAdjustmentRed"], 7)
        self.assertEqual(fields["ColorGradeShadowHue"], 204)
        self.assertEqual(fields["ToneCurveName2012"], "Custom")
        self.assertEqual(len(preset.curves["rgb"]), 4)
        self.assertFalse(fields["WhiteBalance"] == "Custom")

    def test_zero_wb_stays_as_shot(self):
        fields = fields_of({"name": "z", "state": {"temperature": 0, "tint": 0, "contrast": 5}})
        self.assertEqual(fields["WhiteBalance"], "As Shot")
        self.assertNotIn("Temperature", fields)
        self.assertNotIn("Tint", fields)

    def test_real_filter_warns_about_unmappable_keys(self):
        preset = p2x.parse_presets(REAL_FILTER, "cf6-real.json")[0]
        _xmp, warnings = p2x.build_xmp(preset)
        joined = " ".join(warnings)
        self.assertIn("gamma", joined)
        self.assertIn("distortion", joined)



class TestInlineSources(unittest.TestCase):
    def test_gather_keeps_urls_and_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "a.json")
            with open(path, "w") as fh:
                json.dump(COMPACT, fh)
            got = p2x.gather_inputs(["1400644", "https://www.polarr.co/f/x", path])
        self.assertEqual(got, ["1400644", "https://www.polarr.co/f/x", path])

    def test_gather_ignores_typos(self):
        self.assertEqual(p2x.gather_inputs(["nope.txt"]), [])

    def test_cli_accepts_share_url(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes) as fake_base:
                with tempfile.TemporaryDirectory() as tmp:
                    out = os.path.join(tmp, "out")
                    rc = p2x.main([f"{fake_base}/users/custom_filter/1400644", "-o", out])
                    self.assertEqual(rc, 0)
                    self.assertTrue(os.path.exists(os.path.join(out, "CF6.xmp")))

    def test_cli_accepts_bare_id(self):
        routes = {}
        with local_server(routes) as base:
            routes.update(scan_routes({"base": base}))
            with fake_polarr(routes):
                with tempfile.TemporaryDirectory() as tmp:
                    out = os.path.join(tmp, "out")
                    self.assertEqual(p2x.main(["1400644", "-o", out]), 0)
                    self.assertTrue(os.path.exists(os.path.join(out, "CF6.xmp")))

    def test_cli_rejects_missing_file(self):
        with self.assertRaises(SystemExit):
            p2x.main(["no-such-preset.json"])


# ---------------------------------------------------------------------------
# vsco reads a recipe card; snapseed reads the tools it shows; the router picks
# ---------------------------------------------------------------------------

vsco = p2x.sources.vsco
snapseed = p2x.sources.snapseed
router = p2x.router


def read_look(module, text, **kw):
    preset = module.parse(text, "look.txt", **kw)[0]
    return preset, p2x.build_lightroom(preset)[0]


class TestVsco(unittest.TestCase):
    def test_exposure_reads_in_ev(self):
        _p, fields = read_look(vsco, "A6\nExposure +1.5")
        self.assertEqual(fields["Exposure2012"], 1.5)

    def test_negative_exposure(self):
        _p, fields = read_look(vsco, "B1\nexposure: -2")
        self.assertEqual(fields["Exposure2012"], -2.0)

    def test_contrast_scales_to_slider_range(self):
        _p, fields = read_look(vsco, "C1\ncontrast +3")
        self.assertEqual(fields["Contrast2012"], 50)

    def test_fade_lifts_blacks(self):
        _p, fields = read_look(vsco, "D1\nfade +12")
        self.assertEqual(fields["Blacks2012"], 100)

    def test_vignette_sign_flips(self):
        _p, fields = read_look(vsco, "E1\nvignette +3")
        self.assertEqual(fields["PostCropVignetteAmount"], -25)

    def test_hsl_band(self):
        _p, fields = read_look(vsco, "F1\nred hue +3\norange saturation -6")
        self.assertEqual(fields["HueAdjustmentRed"], 50)
        self.assertEqual(fields["SaturationAdjustmentOrange"], -100)

    def test_split_tone_becomes_colour_grading(self):
        _p, fields = read_look(vsco, "G1\nshadow hue 210\nshadow saturation 6")
        self.assertEqual(fields["ColorGradeShadowHue"], 210)
        self.assertEqual(fields["ColorGradeShadowSat"], 100)

    def test_filter_code_is_the_name(self):
        self.assertEqual(vsco.parse("A6\ncontrast +1")[0].name, "A6")

    def test_card_with_multiple_recipes(self):
        presets = vsco.parse("A6\ncontrast +1\nB2\ncontrast -2\nfade +6")
        self.assertEqual([p.name for p in presets], ["A6", "B2"])
        self.assertEqual(len(presets[1].values), 2)

    def test_json_recipe(self):
        preset = vsco.parse(json.dumps({"filter": "AL3", "tools": {"exposure": 1, "grain": 12}}))[0]
        self.assertEqual(preset.name, "AL3")
        self.assertAlmostEqual(preset.values["exposure"], 0.5)

    def test_json_hsl_object(self):
        preset = vsco.parse(json.dumps({"tools": {"blue": {"hue": 3, "luminance": -6}}}))[0]
        self.assertAlmostEqual(preset.values["hue_blue"], 0.5)
        self.assertAlmostEqual(preset.values["luminance_blue"], -1.0)

    def test_black_and_white(self):
        preset = vsco.parse("B1\nblack and white, contrast +1")[0]
        fields = p2x.build_lightroom(preset)[0]
        self.assertEqual(fields["ConvertToGrayscale"], "True")

    def test_unsupported_tool_reported(self):
        preset = vsco.parse("X1\nskin tone +4\nfade +2")[0]
        self.assertTrue(any("skin tone" in note for note in preset.notes))

    def test_empty_recipe_raises(self):
        with self.assertRaises(ValueError):
            vsco.parse("nothing to see here")


class TestSnapseed(unittest.TestCase):
    def test_brightness_becomes_exposure(self):
        _p, fields = read_look(snapseed, "brightness +20")
        self.assertEqual(fields["Exposure2012"], 0.4)

    def test_tune_sliders_one_to_one(self):
        _p, fields = read_look(snapseed, "contrast -15, saturation +10, highlights -40, shadows +25")
        self.assertEqual(fields["Contrast2012"], -15)
        self.assertEqual(fields["Saturation"], 10)
        self.assertEqual(fields["Highlights2012"], -40)
        self.assertEqual(fields["Shadows2012"], 25)

    def test_ambience_spreads_over_shadows_and_clarity(self):
        _p, fields = read_look(snapseed, "ambience +100")
        self.assertEqual(fields["Shadows2012"], 55)
        self.assertEqual(fields["Clarity2012"], 20)

    def test_structure_spreads_over_texture_and_clarity(self):
        _p, fields = read_look(snapseed, "structure +100")
        self.assertEqual(fields["Texture"], 60)
        self.assertEqual(fields["Clarity2012"], 35)

    def test_warmth_moves_temperature(self):
        _p, fields = read_look(snapseed, "Look: Warm\nwarmth +40")
        self.assertEqual(fields["WhiteBalance"], "Custom")
        self.assertEqual(fields["Temperature"], 6900)

    def test_vignette_sign_flips(self):
        _p, fields = read_look(snapseed, "vignette 30")
        self.assertEqual(fields["PostCropVignetteAmount"], -30)

    def test_grain_and_sharpening(self):
        _p, fields = read_look(snapseed, "grain 20, sharpening 10")
        self.assertEqual(fields["GrainAmount"], 20)
        self.assertEqual(fields["Sharpness"], 10)

    def test_overlapping_sliders_clamp(self):
        _p, fields = read_look(snapseed, "shadows +100, ambience +100")
        self.assertEqual(fields["Shadows2012"], 100)

    def test_curve_points(self):
        preset = snapseed.parse("Curves: 0,0 64,70 128,140 255,255")[0]
        self.assertEqual(len(preset.curves["rgb"]), 4)
        fields = p2x.build_lightroom(preset)[0]
        self.assertEqual(fields["ToneCurveName2012"], "Custom")

    def test_per_channel_curve(self):
        preset = snapseed.parse("curves red 0,0 128,150 255,255")[0]
        self.assertIn("red", preset.curves)

    def test_black_and_white_json_with_filter(self):
        preset = snapseed.parse(json.dumps({
            "name": "Mono Red",
            "tools": {"black and white": {"filter": "red", "contrast": 25}}}))[0]
        fields = p2x.build_lightroom(preset)[0]
        self.assertEqual(fields["ConvertToGrayscale"], "True")
        self.assertGreater(fields["GrayMixerRed"], 50)

    def test_json_tool_container(self):
        preset = snapseed.parse(json.dumps({"tune image": {"brightness": -25, "warmth": 40}}))[0]
        self.assertAlmostEqual(preset.values["exposure"], -0.25)
        self.assertAlmostEqual(preset.values["temperature"], 0.4)

    def test_unsupported_tool_reported(self):
        preset = snapseed.parse("HDR Scape: 60\nbrightness +5")[0]
        self.assertTrue(any("hdr scape" in note for note in preset.notes))

    def test_name_from_look_line(self):
        self.assertEqual(snapseed.parse("Look: Faded City\nbrightness +5")[0].name, "Faded City")

    def test_empty_look_raises(self):
        with self.assertRaises(ValueError):
            snapseed.parse("just words")


class TestRouter(unittest.TestCase):
    def test_detects_polarr_json(self):
        text = json.dumps(REAL_FILTER)
        self.assertEqual(router.detect(text, json.loads(text)), "polarr")

    def test_detects_snapseed_card(self):
        text = "Tune Image: ambience +30, structure +20, warmth +5"
        self.assertEqual(router.detect(text), "snapseed")

    def test_detects_vsco_card(self):
        text = "A6\nExposure +1.5\nFade +6"
        self.assertEqual(router.detect(text), "vsco")

    def test_detects_unnested_percent_polarr(self):
        text = json.dumps({"FilterName": "F", "adjustments": {"Exposure": -6, "GrainAmount": 18}})
        self.assertEqual(router.detect(text, json.loads(text)), "polarr")

    def test_unknown_json_defaults_to_polarr(self):
        text = json.dumps({"name": "x", "adjustments": {"contrast": 0.2}})
        self.assertEqual(router.detect(text, json.loads(text)), "polarr")

    def test_reads_a_friend_folder_mixed(self):
        with tempfile.TemporaryDirectory() as tmp:
            src = os.path.join(tmp, "looks")
            os.makedirs(src)
            with open(os.path.join(src, "a.json"), "w") as fh:
                json.dump({"name": "From Polarr", "adjustments": {"contrast": 0.2}}, fh)
            with open(os.path.join(src, "b.txt"), "w") as fh:
                fh.write("A6\ncontrast +2\nfade +6")
            with open(os.path.join(src, "c.txt"), "w") as fh:
                fh.write("Tune Image: ambience +30, structure +20")
            out = os.path.join(tmp, "out")
            written = p2x.convert([src], out)
        names = sorted(os.path.basename(path) for path, _a, _b in written)
        self.assertEqual(names, ["A6.xmp", "From Polarr.xmp", "Snapseed Look.xmp"])

    def test_forced_reader(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "look.json")
            with open(path, "w") as fh:
                json.dump({"contrast": 3, "fade": 6}, fh)
            out = os.path.join(tmp, "out")
            written = p2x.convert([path], out, kind="vsco")
        self.assertEqual(len(written), 1)

    def test_vsco_link_explains_itself(self):
        with self.assertRaises(ValueError):
            router.read("https://vsco.co/someone/gallery/abc")

    def test_bad_file_does_not_stop_the_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            good = os.path.join(tmp, "good.json")
            with open(good, "w") as fh:
                json.dump({"name": "Good", "adjustments": {"contrast": 0.2}}, fh)
            bad = os.path.join(tmp, "bad.txt")
            with open(bad, "w") as fh:
                fh.write("no tools here at all")
            out = os.path.join(tmp, "out")
            written = p2x.convert([good, bad], out)
        self.assertEqual(len(written), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
