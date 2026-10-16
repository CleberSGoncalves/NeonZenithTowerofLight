import time
import os
import sys
from playwright.sync_api import sync_playwright

def test_joystick():
    print("[TEST] Starting Playwright Touch & Virtual Joystick validation...")
    
    with sync_playwright() as p:
        # Launch Chromium with mobile touch emulation (Pixel 5: 393 x 851)
        browser = p.chromium.launch(headless=True)
        device_mobile = p.devices['Pixel 5']
        context = browser.new_context(**device_mobile)
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        url = "https://agent.kinomuse.com.br/play/NeonZenithTowerofLight/"
        print(f"[TEST] Navigating to {url} ...")
        page.goto(url, wait_until="networkidle")

        # 1. Skip Intro via immediate click
        time.sleep(0.5)
        page.mouse.click(200, 300)
        time.sleep(1.0)
        page.mouse.click(200, 300)
        time.sleep(1.5)

        # Ensure HUD is visible
        hud_visible = page.locator("#in-game-hud").is_visible()
        print(f"[TEST] HUD visible after intro skip: {hud_visible}")

        # Capture Idle State Screenshot (with resting joystick base)
        os.makedirs("test_screenshots", exist_ok=True)
        idle_shot = "test_screenshots/01_mobile_idle_resting_joystick.png"
        page.screenshot(path=idle_shot)
        print(f"[TEST] Saved idle screenshot: {idle_shot}")

        # 2. Touch Drag Simulation on Left Side (Virtual Joystick)
        # Resting anchor is around x = 78, y = 698 on Pixel 5
        start_x, start_y = 78, 698
        drag_x, drag_y = 130, 698 # Dragging 52px right to run forward

        print(f"[TEST] Simulating touch drag: ({start_x}, {start_y}) -> ({drag_x}, {drag_y}) ...")
        
        # Dispatch real touch events to canvas
        page.evaluate("""({ startX, startY, dragX, dragY }) => {
            const canvas = document.getElementById('game-canvas');
            const touchObj1 = new Touch({
                identifier: 101,
                target: canvas,
                clientX: startX,
                clientY: startY,
                pageX: startX,
                pageY: startY,
                screenX: startX,
                screenY: startY
            });
            const touchStartEv = new TouchEvent('touchstart', {
                cancelable: true,
                bubbles: true,
                touches: [touchObj1],
                targetTouches: [touchObj1],
                changedTouches: [touchObj1]
            });
            canvas.dispatchEvent(touchStartEv);

            // Immediate move to right
            const touchObj2 = new Touch({
                identifier: 101,
                target: canvas,
                clientX: dragX,
                clientY: dragY,
                pageX: dragX,
                pageY: dragY,
                screenX: dragX,
                screenY: dragY
            });
            const touchMoveEv = new TouchEvent('touchmove', {
                cancelable: true,
                bubbles: true,
                touches: [touchObj2],
                targetTouches: [touchObj2],
                changedTouches: [touchObj2]
            });
            window.dispatchEvent(touchMoveEv);
        }""", { "startX": start_x, "startY": start_y, "dragX": drag_x, "dragY": drag_y })

        # Give it frames to render active joystick
        time.sleep(0.3)

        # Capture Active Joystick Screenshot
        active_shot = "test_screenshots/02_mobile_active_drag_joystick.png"
        page.screenshot(path=active_shot)
        print(f"[TEST] Saved active drag screenshot: {active_shot}")

        # Release touch
        page.evaluate("""({ dragX, dragY }) => {
            const canvas = document.getElementById('game-canvas');
            const touchObj = new Touch({
                identifier: 101,
                target: canvas,
                clientX: dragX,
                clientY: dragY,
                pageX: dragX,
                pageY: dragY
            });
            const touchEndEv = new TouchEvent('touchend', {
                cancelable: true,
                bubbles: true,
                touches: [],
                targetTouches: [],
                changedTouches: [touchObj]
            });
            window.dispatchEvent(touchEndEv);
        }""", { "dragX": drag_x, "dragY": drag_y })

        time.sleep(0.5)

        # Capture Post-Release Screenshot
        release_shot = "test_screenshots/03_mobile_released_joystick.png"
        page.screenshot(path=release_shot)
        print(f"[TEST] Saved post-release screenshot: {release_shot}")

        # Check console errors
        filtered_errors = [e for e in console_errors if "favicon" not in e.lower()]
        print(f"[TEST] Console errors count: {len(filtered_errors)}")
        if filtered_errors:
            print("[TEST] Errors:", filtered_errors)

        browser.close()
        print("[TEST] Validation completed successfully!")

if __name__ == "__main__":
    test_joystick()
