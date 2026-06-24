# Fontopia {{VERSION}}

Welcome to Fontopia, a desktop font exploration and comparison tool.

## Launching the Application

1. Extract the ZIP archive to a folder of your choice.
2. Open the extracted folder.
3. Double-click:

   Fontopia.exe

Your default web browser will automatically open the application.  It may take a few minutes for the application to load in the browser.

## Version History
### v0.2.2
- BUG: repair cmap tables on some fonts (c90b103)
- Add debug capture of API requests (a637543)
- Effervescence on like / no-like (cf56c2b)
- Add close button to tag pop-over (9105fa2)
- tags to require click instead of hover to open (7d60211)

### v0.2.1
- Migrate user tag data to APPDATA (ae9840e)
- BUG: repair some fonts on-the-fly that fail to load in the browser (ef8603e)

### v0.2.0
- Show total font count and viewable font count (ddaf06d)
- Add default behavior to hide No-Likey fonts (d1f1276)
- hearts and poops animated (90ea4ac)
- Animate the grid adjusting to a card removal. (8a6f82c)
- Removing a card due to visibility change, causes it to fade out (1ed3c2e)
- Evaluate card visibility after like / no-like change (412f6da)
- refactor font search to separate concerns of text vs tags (88760f1)
- Buttons update when tags are removed via tag summary (708f667)
- Buttons now reflect the state associated with the font card (135f247)
- buttons set tags accordingly (9b9e5cf)
- Add the like/no-like buttons to the cards. (772d3c1)
- Liked fonts are now tagged "Likey" (4434472)
- Extract search-tag suggestions into a controller. (915f955)
- Exclude suggested tags for existing search constraints (324bb60)
- allow hide tag too (56b6d01)
- Add tag suggestions to search input (6700cfe)
- Search chip indicates when set for tag (7130b2b)
- Tag search should match tag exactly (e1cb326)
- initial tag search implementation (27dc925)
- complete the rename of tag_response.py (b98823f)
- rename TagResponse.py (0de69f4)
- Parts missed in prior commit... doh! (fb80491)
- Extract input field suggestion decorator (a245aae)
- Remove tag-button hover-over text (0596541)
- Rank suggestions by case-sensitive distance from the existing input. (e108430)
- Extract most recent request tracker to a foundation component. (a5635ad)
- Protect against overlapping list-tag requests that causes duplicates in the suggestions. (f94da3c)
- Tab to highlight/select suggested tag (2716d88)
- BUG: autocomplete selection should not commit (c430d04)
- Tag autocomplete initial infrastructure. (2d5ad9f)
- Extract FontGridCardView into its own module (497591d)
- Extract card tags to a separate module (362d2e8)
- BUG: removing last tag does not update tag adornment. (d997f73)
- Provide toast/undo when removing a tag (0606f79)
- Remove tag from font, via 'x' on tag chip (e5d612d)
- BUG: font goes out of scope in closure for _updateTagSummary() (519909a)
- Assigned tags display as chip cards (e3dc53e)
- Default card size = LARGE (b0e7d5c)
- Enable adding tags to cards that currently have none (c6337bc)
- Removed popover hover zone so that tag popup appears only when hovering over the tag adornment. (048c048)
- Slide tag summary popup down to cover the adornment. (2c84880)
- BUG: Repair horizontal spacing in the tag editor (d87a13f)
- Tag=add button disabled until input is valid. (e2c3723)
- Remove '+' button in Tags title. (d40ecc4)
- New tag entry field, submit and apiclient changes (9812315)
- Repair tracing issue with '+' button click (83a2ea2)
- Green add-tag button (b8cf2d7)
- BUG: fix hover dropout for tag adornment (2fb510f)
- Add '+' to Tags hover pop-up. (d3e7d84)
- List tags assigned upon hover over tag adornment. (5c2a91f)
- Reformat the font-card (d69871a)
- Use a tag image (ed96870)
- Consolidate tag loading into a module (a51f61e)
- Simple tag count on a font-card. (c294cc1)
- Liking a font marks it with a Like tag. (9685fad)
- Serialize FontTagRepository to persistent store. (4544681)
- Initial tagging back-end, with unit tests (13e1926)
- Extract a font key into its own model to be used across components. (1407abf)
- Continuity documentation update (a535c71)
- Add huge option for card display (c7be828)
- Adjustable font card sizes (432c1a3)
- Capture more font metadata. (8ca867d)
- Configure debug launch (38b04be)

### v0.1.1
- BUG: unable to parse build_info for about box (5b4b71f)
- Consolidate trace/probe settings into application configuration. (2ec75f1)

### v0.1.0
* initial distribution

## Notes

* Fontopia runs entirely on your local machine.
* No internet connection is required after launch.
* The application scans fonts installed on your system.
* Some antivirus products may briefly inspect the executable the first time it is launched because it is a packaged Python application.

## Requirements

* Windows 10 or newer
* A modern web browser such as:

  * Microsoft Edge
  * Google Chrome
  * Firefox

## Troubleshooting

If the application window does not appear:

1. Wait a few seconds after launching the executable.
2. Check whether your browser opened behind other windows.
3. Try launching the executable again.

If Windows Defender or SmartScreen displays a warning:

1. Select "More info"
2. Select "Run anyway"

## Closing the Application

Closing the browser tab does not currently terminate the background application process.

To fully close Fontopia:

1. Locate the console window that launched with the application.
2. Close that console window.

Future versions will support cleaner desktop-style shutdown behavior.

Thank you for using Fontopia!
