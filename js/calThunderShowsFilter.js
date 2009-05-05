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
 * <p>Note: This needs an implied "include *" after the last filter if the last
 * filter is an exclude. This needs an "exclude *" if the last filter is an
 * include.</p>
 *
 * <p>"include *" == "exclude not *" == "exclude \0"
 * <br />
 * "include \0" == "exclude not \0" == "exclude *"</p>
 *
 * @param	{Filter[]} aFilters
 * @param	{Shows[]} aShows
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
