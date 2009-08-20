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
 * Portions created by the Initial Developer are Copyright (C) 2009
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

// To load as a module
var EXPORTED_SYMBOLS = ["Show"];
 
/**
 * Creates a new Show
 * @class									Represents a show.
 * @requires	Filter
 * @since		0.4
 * @property	{uid} uid					A unique identifier
 * @property	{String} showName			The name of the show
 * @property	{String} startTime			The start time as a string (i.e. 2009-04-04 00:30:00)
 * @property 	{String} timezone			The timezone string (i.e. UTC)
 * @property	{String} endTime			The end time as a string (i.e. 2009-04-04 01:00:00)
 * @property	{String} network			The network name
 * @property	{String} episodeName		The name of the episode
 * @property	{int} seasonNumber			What season the show is in
 * @property	{int} episodeNumber		What episode (in the current season) the show is in
 * @property	{String} description		A description of the episode
 * @property	{String[]} genres			An array of the genres for the show
 *
 * @param		{uid} aUid					A unique identifier
 * @param		{String} aShowName			The name of the show
 * @param		{String} aStartTime			The start time as a string (i.e. 2009-04-04 00:30:00)
 * @param 		{String} aTimezone			The timezone string (i.e. UTC)
 * @param		{String} aEndTime			The end time as a string (i.e. 2009-04-04 01:00:00)
 * @param		{String} aNetwork			The network name
 * @param		{String} aEpisodeName		The name of the episode
 * @param		{int} aSeasonNumber			What season the show is in
 * @param		{int} aEpisodeNumber		What episode (in the current season) the show is in
 * @param		{String} aDescription		A description of the episode
 * @param		{String[]} aGenres			An array of the genres for the show
 */
function Show(aUid, aShowName, aStartTime, aTimezone, aEndTime, aNetwork, aEpisodeName,
			  aSeasonNumber, aEpisodeNumber, aDescription, aGenres) {
	/**
	 * The unique user id
	 * @type uid
	 */
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
/**
 * Convert the Show instance to a calIEvent (as given by
 * calendar/base/public/calIEvent.idl).
 *
 * @param	{Show} aShow				The Show to turn into an event
 * @param	{calICalendar} aCalendar	The calICalendar the event will be a part of
 * @param	{calIDateTime} aRangeStart	(inclusive) range start or null (open range)
 * @param	{calIDateTime} aRangeEnd	(exclusive) range end or null (open range)
 * @param	{int} aOffset				Time to offset all events (i.e. hours for a timezone)
 * @param	{bool} isAllDayEvent		true if the event is all day, false if it has a time attached to it
 */
Show.toCalIEvent = function(aShow, aCalendar, aRangeStart, aRangeEnd, aOffset, isAllDayEvent) {
	var item = createEvent();
	item.calendar = aCalendar;

	// Parse dates
	try {
		item.startDate = cal.fromRFC3339(aShow.startTime.replace(' ', 'T') + "Z"); // Assume UTC time
		// Seems to be UTC even though EST in XML file, manually set it to UTC
		item.endDate = (aShow.endTime ? cal.fromRFC3339(aShow.endTime.replace(' ', 'T') + "Z") : item.startDate.clone()); // Assume UTC time
		item.setProperty("DTSTAMP", now()); // calUtils.js

		if (isAllDayEvent) {
			// Handle all day events
			item.startDate = offsetDateTime(item.startDate, -24*60*60);
			item.startDate.hour = 0;
			item.startDate.minute = 0;
			item.startDate.second = 0;
			// From: calendar/base/public/calIEvent.idl
			//   Note that for all-day events, non-inclusive means that aShow
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
		} else if (aOffset != null) {
			// Show times are from EST, if PST or MST we must offset aShow
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
	item.id = (aShow.uid ? aShow.uid : getUUID());
	
	if (aShow.network) {
		// Set the location to the network
		item.setProperty("LOCATION", aShow.network);
	}

	// aShow needs to be handled better (i.e. what if we're missing parts of the data)
	if (aShow.showName || aShow.episodeName || aShow.seasonNumber || aShow.episodeNumber) {
		item.title = aShow.showName.convertHTMLToPlainText() + " - "
					 + aShow.episodeName.convertHTMLToPlainText() + " (S"
					 + aShow.seasonNumber.padLeft('0', 2) + "E"
					 + aShow.episodeNumber.padLeft('0', 2) + ")";
	}

	if (aShow.description) {
		// Set the description if it exists
		// Replace HTML line breaks with Unicode line breaks
		item.setProperty("DESCRIPTION", aShow.description.convertHTMLToPlainText());
	}

	// Set genres to item
	// Don't need to check if it exists:
	//   aShow will always exist with at least "TV Shows" in it
	item.setCategories(aShow.genres.length, aShow.genres);

	item.makeImmutable();
	return item;
}
