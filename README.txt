------------------------------------------
Credits
------------------------------------------
A huge thanks to all contributors of this extensions!

Philipp Kewisch
	The author of the hCalendar Provider which served as a template for
	ThunderShows, also the author of Provider for Google Calendar which
	ThunderShows uses a function from
Ingo Müller
	The author of the ThunderBirthDay calendar provider which served as a
	learning process reverse engineering the provider code
	[http://ingomueller.net]
Chris Brousseau
	For making the duty free icon used for this extension and helping with
	discussions of code and debugging
B. Agricola
	Provides the XML feed that ThunderShows works off of (and was kind enough
	to add a few fields to it for use)
	[http://on-my.tv/]

------------------------------------------
Usage
------------------------------------------

1.  Create a new calendar and choose a remote calendar with "ThunderShows"
	as the provider
2.  Go into the options of that calendar (right click > "Properties")
3.  Choose the "ThunderShows Provider" tab
4.  Add the shows you would like to have appear as events (shows must exactly
	match the name of the show -- see http://on-my.tv/show-select)


------------------------------------------
Known issues
------------------------------------------

See: http://code.google.com/p/thundershows/issues/list?can=2&q=label%3AType-Defect

------------------------------------------
Possible new features
------------------------------------------

See: http://code.google.com/p/thundershows/issues/list?can=2&q=label%3AType-Enhancement



------------------------------------------
Resources for developers
------------------------------------------

* http://www.ietf.org/rfc/rfc3339.txt -- RFC3339 Date/Time format
* http://mxr.mozilla.org/comm-central/source/calendar/ -- Source code of Lightning
* http://mxr.mozilla.org/comm-central/source/calendar/base/public/ -- Includes many
  of the objects ThunderShows implements
* http://mxr.mozilla.org/comm-central/source/calendar/base/src/calUtils.js -- Useful
  functions for calendars
* http://kb.mozillazine.org/Add-ons_Index_-_Sunbird_Lightning_Calendar -- Sunbird/
  Lightning Calendar Add-ons Index, including experimental providers, synchronization,
  Import/Export, etc.
