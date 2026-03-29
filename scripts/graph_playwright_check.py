from __future__ import annotations

import math
import os
import sys
from pathlib import Path

PLAYWRIGHT_PATHS = [
    "/home/zhouzhiwang/.cache/uv/archive-v0/iYXhyAQBlcv95COxJMFVs",
    "/home/zhouzhiwang/.cache/uv/archive-v0/4crV931GsrChwt16nptNq",
    "/home/zhouzhiwang/.cache/uv/archive-v0/PlfID-movAOZ-hpePgUkU",
]

for path in reversed(PLAYWRIGHT_PATHS):
    if path not in sys.path:
        sys.path.insert(0, path)

from playwright.sync_api import sync_playwright

CHROME_EXECUTABLE = "/home/zhouzhiwang/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"
GRAPH_URL = os.environ.get("GRAPH_URL", "http://127.0.0.1:3460/#/graph")
EXPECTED_Y_LABELS = [
    "Foundational Theory",
    "Core Mechanism",
    "Applied Development",
    "Clinical / Engineering",
]
BEFORE_SCREENSHOT = Path("/tmp/seevomap-graph-boundary-before.png")
AFTER_SCREENSHOT = Path("/tmp/seevomap-graph-boundary-after.png")


def get_camera_state(page):
    return page.evaluate(
        """() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) {
            throw new Error('Graph canvas not found');
          }
          return {
            scale: Number(canvas.dataset.cameraScale || '0'),
            contourProbeX: Number(canvas.dataset.contourProbeX || '0'),
            contourProbeY: Number(canvas.dataset.contourProbeY || '0'),
          };
        }"""
    )


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            executable_path=CHROME_EXECUTABLE,
            headless=True,
        )
        page = browser.new_page(viewport={"width": 1600, "height": 1100}, device_scale_factor=1)
        page.goto(GRAPH_URL, wait_until="networkidle")
        dark_toggle = page.locator("button", has_text="Dark")
        if dark_toggle.count() > 0:
            dark_toggle.first.click()
            page.wait_for_timeout(250)

        for label in EXPECTED_Y_LABELS:
            if page.locator(f"text={label}").count() == 0:
                raise AssertionError(f"Missing y-axis label: {label}")

        page.wait_for_function(
            "() => Number(document.querySelector('canvas')?.dataset.cameraScale || 0) > 0"
        )
        initial = get_camera_state(page)
        if abs(initial["scale"] - 1) > 0.02:
            raise AssertionError(f"Expected initial camera scale near 1, got {initial['scale']}")

        canvas = page.locator("canvas")
        box = canvas.bounding_box()
        if box is None:
            raise AssertionError("Canvas bounding box not found")

        canvas.screenshot(path=str(BEFORE_SCREENSHOT))
        center_x = box["x"] + box["width"] * 0.5
        center_y = box["y"] + box["height"] * 0.48
        page.mouse.move(center_x, center_y)
        page.mouse.wheel(0, -1500)
        page.wait_for_timeout(500)

        zoomed = get_camera_state(page)
        canvas.screenshot(path=str(AFTER_SCREENSHOT))
        moved = math.hypot(
            zoomed["contourProbeX"] - initial["contourProbeX"],
            zoomed["contourProbeY"] - initial["contourProbeY"],
        )

        if zoomed["scale"] <= initial["scale"] + 0.01:
            raise AssertionError(
                f"Camera scale did not increase on zoom; initial={initial['scale']}, zoomed={zoomed['scale']}"
            )
        if moved <= 3:
            raise AssertionError(
                "Boundary contour probe did not respond to zoom; expected the semantic contour to move with the camera"
            )

        print("graph Playwright checks passed")
        browser.close()


if __name__ == "__main__":
    main()
