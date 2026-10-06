# Iconic

Iconic turns an arbitrary image into a clean logo file at an exact size, entirely in the browser.

## Language

**Source image**:
The image a user provides, from a file, a link, the clipboard or a Dashboard Icon, decoded and ready to draw.
_Avoid_: Input, upload, original

**Content bounds**:
The rectangle inside the source image that contains the logo itself, without empty margins.
_Avoid_: Crop box, bounding box, trim rect

**Trim**:
Using the content bounds instead of the full source image, so padding applies to the logo and not to margins the source already had.
_Avoid_: Crop, auto-crop

**Logo options**:
The user's choices for the output: size, padding, background, square and trim.
_Avoid_: Settings, config

**Size**:
The longest edge of the output in pixels, or both edges when squared. Presets are small (256), medium (512) and large (1024).
_Avoid_: Resolution, dimensions

**Padding**:
Empty space in pixels between the logo and the edges of the output, counted inside the size.
_Avoid_: Margin

**Square**:
An output with equal edges where the whole logo is centered and fully visible, never cropped.
_Avoid_: Fit, crop to square

**Logo plan**:
The computed layout: output dimensions, which region of the source image to draw, and where to draw it.
_Avoid_: Layout, geometry

**Proof**:
The live preview of the logo plan, shown with crop marks and dimension lines like a print proof.
_Avoid_: Preview canvas, thumbnail

**Dashboard Icon**:
An app or service logo from the homarr-labs/dashboard-icons collection (dashboardicons.com).
_Avoid_: Icon pack, preset icon
