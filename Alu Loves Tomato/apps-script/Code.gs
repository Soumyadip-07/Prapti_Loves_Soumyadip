/**
 * Prapti Birthday Gallery — Google Apps Script
 *
 * 1) Create a folder in Google Drive for ONLY the photos you want on the site.
 * 2) Copy the folder ID from its URL.
 * 3) Paste it below.
 * 4) Deploy as a Web app, execute as yourself, access: Anyone.
 *
 * IMPORTANT PRIVACY NOTE:
 * The deployed endpoint is public. It only lists images in the configured folder,
 * but the returned thumbnail URLs must be viewable by website visitors. Share only
 * this dedicated folder/photos as "Anyone with the link — Viewer" if appropriate.
 * Do NOT put other personal files in that folder. Anyone with the site/feed URL may
 * see the photos in it. Do not paste OAuth tokens or API keys into the HTML.
 */
const PHOTO_FOLDER_ID = "1wLXySRoFYskE0WoiaYMpVL7LWwKcEPaj";
const MAX_PHOTOS = 100;

function doGet(e) {
  const callback = (e && e.parameter && e.parameter.callback) || "";
  let payload;
  try {
    if (!PHOTO_FOLDER_ID || PHOTO_FOLDER_ID.includes("PASTE_")) {
      throw new Error("Add your Google Drive folder ID in PHOTO_FOLDER_ID.");
    }
    const folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
    const iterator = folder.getFiles();
    const photos = [];
    while (iterator.hasNext() && photos.length < MAX_PHOTOS) {
      const file = iterator.next();
      const mime = file.getMimeType();
      if (!mime || !mime.startsWith("image/")) continue;
      photos.push({
        id: file.getId(),
        name: file.getName(),
        url: "https://drive.google.com/thumbnail?id=" + encodeURIComponent(file.getId()) + "&sz=w1200"
      });
    }
    payload = { ok: true, photos: photos };
  } catch (err) {
    payload = { ok: false, error: String(err && err.message ? err.message : err), photos: [] };
  }

  const json = JSON.stringify(payload);
  // JSONP allows a static site to read the feed without storing Google credentials in the browser.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
