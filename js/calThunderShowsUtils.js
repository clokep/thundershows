/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is ThunderShows Provider code.
 *
 * The Initial Developer of the Original Code is
 *  Patrick Cloke
 *  Philipp Kewisch <mozilla@kewis.ch> (fromRFC3339 function)
 * Portions created by the Initial Developer are Copyright (C) 2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
									.getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("ThunderShows: " + aMessage);
}

/**
 * fromRFC3339
 * Convert a RFC3339 compliant Date string to a calIDateTime.
 * This function was taken from the Provider for Google Calendar
 *
 * @param aStr		  The RFC3339 compliant Date String
 * @return			  A calIDateTime object
 */
function fromRFC3339(aStr) {
	// We always want to use the default timezone for the ThunderShows Provider.
	var aTimezone = calendarDefaultTimezone();

	// XXX I have not covered leapseconds (matches[8]), this might need to
	// be done. The only reference to leap seconds I found is bug 227329.

	// Create a DateTime instance (calUtils.js)
	var dateTime = createDateTime();

	// Killer regex to parse RFC3339 dates
	var re = new RegExp("^([0-9]{4})-([0-9]{2})-([0-9]{2})" +
		"([Tt ]([0-9]{2}):([0-9]{2}):([0-9]{2})(\\.[0-9]+)?)?" + // This is edited (i.e. non-standard) to match [Tt ] instead of [Tt]
		"(([Zz]|([+-])([0-9]{2}):([0-9]{2})))?");

	var matches = re.exec(aStr);

	if (!matches) {
		return null;
	}

	// Set usual date components
	dateTime.isDate = (matches[4]==null);

	dateTime.year = matches[1];
	dateTime.month = matches[2] - 1; // Jan is 0
	dateTime.day = matches[3];

	if (!dateTime.isDate) {
		dateTime.hour = matches[5];
		dateTime.minute = matches[6];
		dateTime.second = matches[7];
	}

	// Timezone handling
	if (matches[9] == "Z") {
		// If the dates timezone is "Z", then this is UTC, no matter
		// what timezone was passed
		dateTime.timezone = UTC();
	} else if (matches[9] == null) {
		// We have no timezone info, only a date. We have no way to
		// know what timezone we are in, so lets assume we are in the
		// timezone of our local calendar, or whatever was passed.

		dateTime.timezone = aTimezone;
	} else {
		var offset_in_s = (matches[11] == "-" ? -1 : 1) *
			( (matches[12] * 3600) + (matches[13] * 60) );

		// try local timezone first
		dateTime.timezone = aTimezone;

		// If offset does not match, go through timezones. This will
		// give you the first tz in the alphabet and kill daylight
		// savings time, but we have no other choice
		if (dateTime.timezoneOffset != offset_in_s) {
			// TODO A patch to Bug 363191 should make this more efficient.

			var tzService = getTimezoneService();
			// Enumerate timezones, set them, check their offset
			var enumerator = tzService.timezoneIds;
			while (enumerator.hasMore()) {
				var id = enumerator.getNext();
				dateTime.timezone = tzService.getTimezone(id);
				if (dateTime.timezoneOffset == offset_in_s) {
					// This is our last step, so go ahead and return
					return dateTime;
				}
			}
			// We are still here: no timezone was found
			dateTime.timezone = UTC();
			if (!dateTime.isDate) {
				dateTime.hour += (matches[11] == "-" ? -1 : 1) * matches[12];
				dateTime.minute += (matches[11] == "-" ? -1 : 1) * matches[13];
			}
		}
	}
	return dateTime;
}

/**
 * offsetDateTime
 * Offset a calIDateTime object by aOffset number of seconds
 *
 * @param aDateTime	  The DateTime object
 * @param aOffset	  The offset (in seconds)
 * @return			  A calIDateTime object
 */
function offsetDateTime(aDateTime, aOffset) {
	if (!aDateTime.isDate && aOffset != 0) {
		// Only if it has a time component
		aDateTime.resetTo(aDateTime.year,
						  aDateTime.month,
						  aDateTime.day,
						  aDateTime.hour,
						  aDateTime.minute,
						  aDateTime.second + aOffset,
						  aDateTime.timezone);
	}
	return aDateTime;
}

/**
 * padLeft
 * Pads a string by adding aPadding to the left of it
 *
 * @param aPadding	A String object to pad with
 * @param aLength	The minimum length of the output String
 */
String.prototype.padLeft = function(aPadding, aLength) {
	var output = this.toString();
	while (output.length < aLength) {
		output = aPadding + output;
	}
	return output;
};

/**
 * convertHTMLToPlainText
 * Replaces HTML tags and entities with plaintext/unicode equivalents
 */
String.prototype.convertHTMLToPlainText = function() {
	var output = this.toString();
	// HTML Tags
	output = output.replace(/<br *\/?>/g, "\r\n"); // Line breaks
	output = output.replace(/<(em|i)>(.+)<\/\1>/g, "/$2/"); // Italics
	output = output.replace(/<(strong|b)>(.+)<\/\1>/g, "*$2*"); // Bold
	output = output.replace(/<u>(.+)<\/\1>/g, "_$2_"); // Underline
	output = output.replace(/<a.+(?:href="(.+)")?.+>(.+)<\/a>/g, "$2 (Source: $1)"); // Links
	
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C4$2\u02C4"); // Superscript
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C5$2\u02C5"); // Subscript

	// HTML Entities
	output = output.replace(/&mdash;/, "\u2014"); // Em Dash
	output = output.replace(/&amp;/, "&"); // Ampersand

	// Clean up a bit
	output = output.replace(/(?:\r\n){3,}/g, "\r\n\r\n"); // Max of two line breaks in a row
	return output;
};

/**
 * Associate array object
 * Make sure that the built in functions do not get overwritten
 */
function AssociativeArray() {}
AssociativeArray.prototype = {
	length: function _length() {
		var count = 0;
		for (ithObj in this) {
			count++;
		}
		// This must be changed to the number of functions built into the class
		count -= 2;
		return count;
	},

	toString: function _toString() {
		return this.toSource();
	}
};

/**
 * Show object
 */
function Show(uid, show_name, start_time, timezone, end_time, network, episode_name,
			  season_number, episode_number, description, /* Array */ genres) {
	this.uid = uid;
	this.show_name = show_name;
	this.start_time = start_time;
	this.timezone = timezone;
	this.end_time = end_time;
	this.network = network;
	this.episode_name = episode_name;
	this.season_number = season_number;
	this.episode_number = episode_number;
	this.description = description;
	this.genres = genres;
}
Show.prototype = {
	toICalEvent: function _toCalIEvent(aCalendar, aRangeStart, aRangeEnd, offset, isAllDayEvent) {
		/*dump(this.show_name + "\n" + this.start_time + "\n" + this.timezone + "\n" + this.end_time + "\n"
			 + this.network + "\n" + this.episode_name + "\n" + this.season_number + "\n" +
			 this.episode_number + "\n" + this.description + "\n" + this.genres);
		return;*/
		var item = createEvent();
		item.calendar = aCalendar;

		// Parse dates
		try {
			item.startDate = fromRFC3339(this.start_time + "Z"); // Assume UTC time
			// Seems to be UTC even though EST in XML file, manually set it to UTC
			//item.endDate = (end_time ? fromRFC3339(end_time + "Z").getInTimezone(UTC()) : item.startDate.clone());
			item.endDate = (this.end_time ? fromRFC3339(this.end_time + "Z") : item.startDate.clone()); // Assume UTC time
			item.setProperty("DTSTAMP", now()); // calUtils.js

			if (isAllDayEvent) {
				// Handle all day events
				item.startDate = offsetDateTime(item.startDate, -24*60*60);
				item.endDate = offsetDateTime(item.endDate, -24*60*60);
				item.startDate.isDate = true;
				item.endDate.isDate = true;
			} else if (offset != null) {
				// Show times are from EST, if PST or MST we must offset this
				item.startDate = offsetDateTime(item.startDate, parseInt(offset));
				item.endDate = offsetDateTime(item.endDate, parseInt(offset));
			}
		} catch (e) {
			WARN("Event was skipped, could not convert dates: " + e);
			return null;
		}

		if (!checkIfInRange(item, aRangeStart, aRangeEnd)) {
			// calUtils has a nice range check for items, skip the item
			// if it is not in range.
			return null;
		}

		// Parse uid, defaulting to a generic uid
		item.id = (this.uid ? this.uid : getUUID());
		
		if (this.network) {
			// Set the location to the network
			item.setProperty("LOCATION", this.network);
		}

		if (this.show_name || this.episode_name || this.season_number || this.episode_number) {
			item.title = this.show_name + " - " + this.episode_name +
						 " (S" + this.season_number.padLeft('0', 2) +
						 "E" + this.episode_number.padLeft('0', 2) + ")";
		}

		if (this.description) {
			// Set the description if it exists
			// Replace HTML line breaks with Unicode line breaks
			item.setProperty("DESCRIPTION", this.description.convertHTMLToPlainText());
		}

		// Set genres to item
		// Don't need to check if it exists:
		//   This will always exist with at least "TV Shows" in it
		item.setCategories(this.genres.length, this.genres);

		item.makeImmutable();
		return item;
	}
};

/**
 * Filter object
 * @param type is a property of Show
 */
function Filter(what, type, filter) {
	this.what = what;
	this.type = type;
	this.filter = filter;
}
