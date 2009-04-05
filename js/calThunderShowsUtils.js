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

/**
 * @fileOverview	This file contains utility classes and functions used by
 *					{@link calThunderShows.js}
 * @name			calThunderShowsUtils.js
 * @author			Patrick Cloke (DarkJedi613@gmail.com)
 * @version			0.4
 * @license			<a href="http://www.mozilla.org/MPL/">MPL</a>
 */

 
function dump(aMessage) {
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
								   .getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage("ThunderShows: " + aMessage);
}

/**
 * Offset a DateTime object by a number of seconds
 *
 * @param	{calIDateTime} aDateTime	The calIDateTime object to offset
 * @param	{int} aOffset				The offset time (in seconds)
 * @return	{calIDateTime}				A DateTime object offset from the given object
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
 * Pads a string by adding aPadding to the left of it until the length is aLength
 *
 * @param	{String} aPadding	A String object to pad with
 * @param	{int} aLength		The minimum length of the output String
 * @return	{String}			A String object of length aLength
 */
String.prototype.padLeft = function(aPadding, aLength) {
	var output = this.toString();
	while (output.length < aLength) {
		output = aPadding + output;
	}
	return output;
};

/**
 * Replaces HTML tags and entities with plaintext/unicode equivalents
 *
 * @return	{String}	The input String cleaned of all HTML entities
 */
String.prototype.convertHTMLToPlainText = function() {
	var output = this.toString();
	// HTML Tags
	output = output.replace(/<br *\/?>/g, "\r\n"); // Line breaks
	output = output.replace(/<(em|i)>([\w\W]+?)<\/\1>/g, "/$2/"); // Italics
	output = output.replace(/<(strong|b)>([\w\W]+?)<\/\1>/g, "*$2*"); // Bold
	output = output.replace(/<u>([\w\W]+?)<\/\1>/g, "_$2_"); // Underline
	output = output.replace(/<a.+?(?:href="(.+)")?.*?>([\w\W]+)<\/a>/g, "$2 (Source: $1)"); // Links
	
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C4$2\u02C4"); // Superscript
	output = output.replace(/<sup>(.+)<\/\1>/g, "\u02C5$2\u02C5"); // Subscript

	// HTML Entities
	output = output.replace(/&mdash;/, "\u2014"); // Em Dash
	output = output.replace(/&amp;/, "&"); // Ampersand

	// Clean up a bit
	output = output.replace(/[(?:\r\n)]{3,}/g, "\r\n\r\n"); // Max of two line breaks in a row
	return output;
};

/**
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
 * Creates a new Show
 * @class									Represents a show.
 * @property	{uid} aUid					A unique identifier
 * @property	{String} aShowName			The name of the show
 * @property	{String} aStartTime			The start time as a string (i.e. 2009-04-04 00:30:00)
 * @property 	{String} aTimezone			The timezone string (i.e. UTC)
 * @property	{String} aEndTime			The end time as a string (i.e. 2009-04-04 01:00:00)
 * @property	{String} aNetwork			The network name
 * @property	{String} aEpisodeName		The name of the episode
 * @property	{int} aSeasonNumber			What season the show is in
 * @property	{int} aEpisodeNumber		What episode (in the current season) the show is in
 * @property	{String} aDescription		A description of the episode
 * @property	{Array} {String} aGenres	An array of the genres for the show
 */
function Show(aUid, aShowName, aStartTime, aTimezone, aEndTime, aNetwork, aEpisodeName,
			  aSeasonNumber, aEpisodeNumber, aDescription, aGenres) {
	this.uid = aUid;
	this.showName = aShowName;
	this.startTime = aStartTime;
	this.timezone = aTimezone;
	this.endTime = aEndTime;
	this.network = aNetwork;
	this.episodeName = aEpisodeName;
	this.seasonNumber = aSeasonNumber;
	this.episodeNumber = aEpisodeNumber;
	this.description = aDescription;
	this.genres = aGenres;
}
Show.prototype = {
	toICalEvent: function _toCalIEvent(aCalendar, aRangeStart, aRangeEnd, aOffset, isAllDayEvent) {
		var item = createEvent();
		item.calendar = aCalendar;

		// Parse dates
		try {
			item.startDate = cal.fromRFC3339(this.startTime.replace(' ', 'T') + "Z"); // Assume UTC time
			// Seems to be UTC even though EST in XML file, manually set it to UTC
			item.endDate = (this.endTime ? cal.fromRFC3339(this.endTime.replace(' ', 'T') + "Z") : item.startDate.clone()); // Assume UTC time
			item.setProperty("DTSTAMP", now()); // calUtils.js

			if (isAllDayEvent) {
				//dump("Start: " + item.startDate + "\n" + item.endDate);
				// Handle all day events
				item.startDate = offsetDateTime(item.startDate, -24*60*60);
				item.startDate.hour = 0;
				item.startDate.minute = 0;
				item.startDate.second = 0;
				// From: calendar/base/public/calIEvent.idl
				//   Note that for all-day events, non-inclusive means that this
				//   will be set to the day after the last day of the event.
				item.endDate = item.startDate.clone();
				item.endDate.resetTo(item.endDate.year,
									 item.endDate.month,
									 item.endDate.day + 1,
									 item.endDate.hour,
									 item.endDate.minute,
									 item.endDate.second,
									 item.endDate.timezone);
				// Setting hour/minute/second is illegal operation if isDate is
				// true
				// See: calendar/base/public/calIDateTime.idl
				item.startDate.isDate = true;
				item.endDate.isDate = true;
				//dump("End: " + item.startDate + "\n" + item.endDate);
			} else if (aOffset != null) {
				// Show times are from EST, if PST or MST we must offset this
				item.startDate = offsetDateTime(item.startDate, parseInt(aOffset));
				item.endDate = offsetDateTime(item.endDate, parseInt(aOffset));
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

		if (this.showName || this.episodeName || this.seasonNumber || this.episodeNumber) {
			item.title = this.showName + " - " + this.episodeName +
						 " (S" + this.seasonNumber.padLeft('0', 2) +
						 "E" + this.episodeNumber.padLeft('0', 2) + ")";
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
 */
function Filter(aName, aProperty, aInclude, aType, aExpression, aEnabled) {
	this.name = aName;
	this.property = aProperty;
	this.include = aInclude;
	this.type = aType;
	this.expression = aExpression;
	this.enabled = aEnabled;
}
Filter.EQUALS = 1;
Filter.LESS_THAN = 1;
Filter.LESS_THAN_EQUALS = 2;
Filter.GREATER_THAN = 3;
Filter.GREATER_THAN_EQUALS = 4;	
Filter.CONTAINS = 5;
Filter.REGEX = 6;
Filter.prototype = {
	/* Constants */
	/**
	 * @constant
	 */
	EQUALS: 0,
	LESS_THAN: 1,
	LESS_THAN_EQUALS: 2,
	GREATER_THAN: 3,
	GREATER_THAN_EQUALS: 4,	
	CONTAINS: 5,
	REGEX: 6,

	/* Members */
	name: null,
	property: null,
	include: null,
	type: null,
	expression: null,
	enabled: null
};
/**
 * Returns whether the given show matches the given filter
 * @param	{Filter} aFilter	The filter to match
 * @param	{Show} aShow		The show to run the filter on
 * @return	{bool}				Whether the show matches the filter
 */
Filter.match = function (aFilter, aShow) {
	switch (aFilter.type) {
		case Filter.EQUALS:
			return aShow[aFilter.property] == aFilter.expression;
		case Filter.LESS_THAN:
			return aShow[aFilter.property] < aFilter.expression;
		case Filter.LESS_THAN_EQUALS:
			return aShow[aFilter.property] <= aFilter.expression;
		case Filter.GREATER_THAN:
			return aShow[aFilter.property] > aFilter.expression;
		case Filter.GREATER_THAN_EQUALS:
			return aShow[aFilter.property] >= aFilter.expression;
		case Filter.CONTAINS:
			return aFilter.expression.indexOf(aShow[aFilter.property]) != "-1";
		case Filter.REGEX:
			var isMatch = false;
			try {
				isMatch = aShow[aFilter.property].match(new RegExp(aFilter.expression));
			} catch (e) {
				WARN("Error with regex: " + e);
			}
			return isMatch != null;
		default:
			return null;
	}
	return false;
};
/**
 * <p>Takes all of the filters and all of the shows and returns the shows that
 * match.</p>
 *
 * <p>Note: This needs an implied "include *" after the last filter if the last
 * filter is an exclude. This needs an "exclude *" if the last filter is an
 * include.</p>
 *
 * <p>"include *" == "exclude not *" == "exclude \0"
 * <br />
 * "include \0" == "exclude not \0" == "exclude *"</p>
 *
 * @param	{Array} {Filter} aFilters
 * @param	{Array} {Shows} aShows
 */
Filter.filterAll = function(aFilters, aShows) {
	var output = new Array();
	for (var aShowKey in aShows) {
		for (var aFilterKey in aFilters) {
			if (!aFilters[aFilterKey].enabled) {
				// Filter is disabled, skip it
				continue;
			}
			var isMatch = Filter.match(aFilters[aFilterKey], aShows[aShowKey]);
			var isInclude = aFilters[aFilterKey].include;
			dump(aFilters[aFilterKey].expression + " " + aShows[aShowKey].showName + " " + isMatch + " " + isInclude);
			if (isInclude && isMatch) {
				// The show matches the filter and we want to include it
				output.push(aShows[aShowKey]);
				dump("included");
				break;
			} else if (!isInclude && isMatch) {
				// The show matches the filer and we want to exclude it (i.e.
				// skip the rest of the filters)
				dump("excluded");
				break;
			}
		}
		dump("fell through");
	}
	return output;
}

var tempFilters = new Array();
tempFilters.push(new Filter("1", "showName", true, Filter.EQUALS, "House", true));
tempFilters.push(new Filter("2", "showName", true, Filter.EQUALS, "Test", true));
tempFilters.push(new Filter("3", "showName", false, Filter.EQUALS, "Temp", true));
tempFilters.push(new Filter("4", "showName", false, Filter.EQUALS, "Blah", true));
tempFilters.push(new Filter("5", "showName", true, Filter.EQUALS, "House", true));
// Pilot
tempFilters.push(new Filter("6", "seasonNumber", false, Filter.GREATER_THAN, "1", true));
tempFilters.push(new Filter("7", "episodeNumber", false, Filter.GREATER_THAN, "1", true));
tempFilters.push(new Filter("implied", "showName", true, Filter.REGEX, ".*", true));

var tempShows = new Array();
tempShows.push(new Show("1", "House", "2009-04-04 00:30:00", "UTC", "2009-04-04 01:00:00", "FOX", "Ep Name", "1", "2", "Descript", Array("Genre 1","Genre 2")));
tempShows.push(new Show("2", "HIMYM", "2009-04-04 00:30:00", "UTC", "2009-04-04 01:00:00", "FOX", "Ep Name", "1", "2", "Descript", Array("Genre 1","Genre 2")));
tempShows.push(new Show("3", "Test", "2009-05-04 00:30:00", "UTC", "2009-05-04 01:00:00", "FOX", "Ep Name", "1", "2", "Descript", Array("Genre 1","Genre 2")));
tempShows.push(new Show("4", "Boop", "2009-04-04 00:30:00", "UTC", "2009-04-04 01:00:00", "FOX", "Ep Name", "3", "2", "Descript", Array("Genre 1","Genre 2")));
tempShows.push(new Show("5", "Blah", "2009-04-04 00:30:00", "UTC", "2009-04-04 01:00:00", "FOX", "Ep Name", "1", "2", "Descript", Array("Genre 1","Genre 2")));
tempShows.push(new Show("6", "Pilot", "2009-04-04 00:30:00", "UTC", "2009-04-04 01:00:00", "FOX", "Ep Name", "1", "1", "Descript", Array("Genre 1","Genre 2")));

var outputShows = Filter.filterAll(tempFilters, tempShows);
for (var i in outputShows) {
	dump(outputShows[i].uid);
}