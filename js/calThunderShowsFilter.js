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
var EXPORTED_SYMBOLS = ["Filter"];
 
/**
 * Creates a new Filter
 *
 * @class									Represents a filter.
 * @requires	Show
 * @since		0.4
 * @property	{String} name				The name of the filter
 * @property	{String} property			A property to match from a {@link Show}
 * @property	{bool} include				true if matched shows are included, false if they are excluded
 * @property	{int} type					Matches a type of filter (i.e. {@link Filter.EQUALS}, {@link Filter.LESS_THAN})
 * @property	{String|int} expression	The filter expression to match
 * @property	{bool} enabled				true if the filter is enabled, false otherwise
 *
 * @param		{String} aName				The name of the filter
 * @param		{String} aProperty			A property to match from a {@link Show}
 * @param		{bool} aInclude				true if matched shows are included, false if they are excluded
 * @param		{int} aType					Matches a type of filter (i.e. {@link Filter.EQUALS}, {@link Filter.LESS_THAN})
 * @param		{String|int} aExpression	The filter expression to match
 * @param		{bool} aEnabled				true if the filter is enabled, false otherwise
 */
function Filter(aName, aProperty, aInclude, aType, aExpression, aEnabled) {
	this.name = aName;
	this.property = aProperty;
	this.include = aInclude;
	this.type = aType;
	this.expression = aExpression;
	this.enabled = aEnabled;
}

/**
 * A filter type, true when the property value exactly equals the filter expression
 * @static
 */
Filter.EQUALS = 1;

/**
 * A filter type, true when the property value is less than the filter expression
 * @static
 */
Filter.LESS_THAN = 1;

/**
 * A filter type, true when the property value is less than or exactly equals the filter expression
 * @static
 */
Filter.LESS_THAN_EQUALS = 2;

/**
 * A filter type, true when the property value is greater thanexactly equals the filter expression
 * @static
 */
Filter.GREATER_THAN = 3;

/**
 * A filter type, true when the property value is greater than or exactly equals the filter expression
 * @static
 */
Filter.GREATER_THAN_EQUALS = 4;

/**
 * A filter type, true when the property value contains the filter expression
 * @static
 */
Filter.CONTAINS = 5;

/**
 * A filter type, true when the property value matches the filter expression
 * @static
 */
Filter.REGEX = 6;

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
 * <p>Note: This includes an implied "include *" after the last filter if the
 * last filter is an exclude. This includes an "exclude *" if the last filter is
 * an include.</p>
 *
 * <p>"include *" == "exclude not *" == "exclude \0"
 * <br />
 * "include \0" == "exclude not \0" == "exclude *"</p>
 *
 * @param	{Filter[]} aFilters	Filter objects to match
 * @param	{Show[]} aShows		Show objects to check Filter objects against
 & @return	{Show[]}			Show objects that match Filter objects
 */
Filter.filterAll = function(aFilters, aShows) {
	if (aFilters[aFilters.length - 1].include) {
		// The last filter is an include, exclude everything after
		// Possible bug: If last filter is disabled
		aFilters.push(new Filter("Exclude All", "showName", false, Filter.REGEX, ".*", true));
	} else {
		// The last filter is an exclude, include everything after
		aFilters.push(new Filter("Include All", "showName", true, Filter.REGEX, ".*", true));
	}

	var output = new Array();

	for (var aShowKey in aShows) {
		// Each show
		for (var aFilterKey in aFilters) {
			// Try each filter
			if (!aFilters[aFilterKey].enabled) {
				// Filter is disabled, skip it
				continue;
			}
			// Whether the filter matches the show
			var isMatch = Filter.match(aFilters[aFilterKey], aShows[aShowKey]);
			// Include or exclude mode
			var isInclude = aFilters[aFilterKey].include;

			if (isInclude && isMatch) {
				// The show matches the filter and we want to include it
				output.push(aShows[aShowKey]);
				break;
			} else if (!isInclude && isMatch) {
				// The show matches the filer and we want to exclude it (i.e.
				// skip the rest of the filters)
				break;
			}
		}
	}
	return output;
}
/**
 * Takes a saved set of filters and returns an Array of Filter objects
 *
 * @param	{String} aSavedFilterSet	A String from Filter.save
 * @return	{Filter[]}					An Array of Filter objects
 */
Filter.load = function(aSavedFilterSet) {
	return JSON.parse(aSavedFilterSet);
}
/**
 * Saves a set of filters to a String
 *
 * @param	{Filter[]} aFilterSet	An Array of Filter objects to save
 * @return	{String}				A String representing the Filter objects
 */
Filter.save = function(aFilterSet) {
	return JSON.stringify(aFilterSet);
}

/*var tempFilters = new Array();
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
}*/
