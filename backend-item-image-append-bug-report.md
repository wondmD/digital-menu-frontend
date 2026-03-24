# Backend Bug Report: Menu Item Image Append Replaces Existing Images

## Summary
When editing a menu item and uploading additional images, the backend replaces the entire image list instead of appending the new images.

## Expected Behavior
- Adding new images during item edit should append to the existing image list.
- Existing images should remain unchanged unless explicitly removed by the user.

## Actual Behavior
- After PATCH item update with new image upload(s), existing images are removed.
- Item ends up with only newly uploaded image(s), or otherwise loses part/all of previous image list.

## Endpoint(s)
- PATCH /my-restaurants/{restaurant_id}/categories/{category_id}/items/{item_id}
- GET /my-restaurants/{restaurant_id}/categories/{category_id}/items/{item_id} (verification)

## Reproduction Steps
1. Create a menu item with at least 2 existing images.
2. Open item edit and upload one additional image.
3. Submit item update.
4. Fetch item details.
5. Observe that previous images are missing/replaced.

## Notes from Frontend Investigation
- Frontend already sends compatibility preserve hints on edit payload:
  - keep_image_urls (repeated)
  - image_urls (repeated)
  - images (numeric IDs when available)
  - image (multipart file parts for new uploads)
- Frontend also performs post-save verification and auto-recovery attempt by re-uploading existing + new files if replacement is detected.
- Despite this, replacement still occurs in affected backend builds.

## Impact
- High: data loss risk for item image galleries during normal editing.
- Users cannot safely append images without losing existing item images.

## Suggested Backend Fix
1. Define and enforce append semantics for item media update.
   - Option A: PATCH append-only for `image` uploads unless explicit remove list is provided.
   - Option B: Add dedicated append endpoint, e.g. POST /items/{item_id}/images.
2. If replacement semantics are intended, require explicit full-list contract and reject partial payloads with clear validation error.
3. Document canonical keep/remove field names (`keep_image_urls`, `image_urls`, `images`, etc.) and accepted formats.

## Suggested Acceptance Test
- Given item has images [A, B]
- When update request uploads [C] without delete intent
- Then resulting list must include [A, B, C]

## Environment
- Repo: digital-menu-frontend
- Branch: 1-home-page-customization
- Date: 2026-03-24
