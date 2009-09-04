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
 * 	 Patrick Cloke
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
 * The calendar to modify, is retrieved from window.arguments[0].calendar
 */
var gCalendar;
/**
 * Filter list to modify, retrieved from gCalendar (if it is of type
 * "thundershows")
 */
var gFilters;

Components.utils.import("resource://thundershows/calThunderShowsFilter.js");

/**
 * Initialization function, populate fields, etc.
 * Note: this does not replace the standard onAcceptDialog()
 */
function cTS_onLoad() {
	// Take the content that's already there and move it to its own tab
	var targetTab = document.getElementById("default-properties-panel");

	// Move the grid (and the default options)
	var defaultOptions = document.getElementById("calendar-properties-grid");
	targetTab.appendChild(defaultOptions.cloneNode(true));
	// Delete the original
	defaultOptions.parentNode.removeChild(defaultOptions);

	gCalendar = window.arguments[0].calendar;
	
	// We only want to run if its a ThunderShows Provider calendar
	if (gCalendar.type == "thundershows") {
		// Populate filter list
		var filterList = document.getElementById("thundershows-filter-list");
		gFilters = gCalendar.getProperty("thundershows.filters");
		if (gFilters != null) {
			// Can only do it if filters exist
			gFilters = Filter.load(gFilters);
			for (var i in gFilters) {
				filterList.appendItem(gFilters[i].name, i);
				// Show the most recent item
				// Ensures that the items value and label are defined
				// (see bug 250123)
				filterList.ensureIndexIsVisible(filterList.getRowCount() - 1);
			}

			// Go back to the first item
			filterList.ensureIndexIsVisible(0);
		}
		// Select default item to fill in fields (simulates a click)
		if (filterList.itemCount > 0) {
			filterList.getItemAtIndex(0).click();
		}

		// Set offset setting
		// All day events have an offset of ""
		var offset = gCalendar.getProperty("thundershows.offset");
		if (offset == null) {
			// Default value is no offset
			offset = "0";
		}
		var offsetPicker = document.getElementById("thundershows-offset-picker");
		// Convert from seconds to hours
		offsetPicker.value = Math.floor(offset / 60 / 60);

		// All day events
		var allDayEvents = gCalendar.getProperty("thundershows.all_day_events");
		document.getElementById("thundershows-all-day-events-checkbox").checked = allDayEvents;
		offsetPicker.disabled = allDayEvents;

		// Populate autocomplete list
		var filterExpression = document.getElementById("thundershows-filter-expression");
		filterExpression.attributes.getNamedItem("autocompletesearchparam").value = gCalendar.getProperty("thundershows.known_shows");
	} else {
		// Disable elements that are only available to ThunderShows Provider
		var els = document.getElementsByAttribute("thundershows-only-property", "true");
		for (var i = 0; i < els.length; i++) {
			els[i].setAttribute("disable-capability", "true");
		}
	}
}

/**
 * Called when the dialog is accepted to save settings
 * Note: this does not replace the standard onAcceptDialog()
 */
function cTS_onAcceptDialog() {
	if (gCalendar.type == "thundershows") {
		// Save filters
		var filters = Filter.save(gFilters);
		alert(filters);
		gCalendar.setProperty("thundershows.filters", filters);

		// Save offset settings
		var offsetPicker = document.getElementById("thundershows-offset-picker");
		// Convert from hours to seconds
		gCalendar.setProperty("thundershows.offset", offsetPicker.value * 60 * 60);

		// Save all day events setting
		var allDayEvents = document.getElementById("thundershows-all-day-events-checkbox");
		gCalendar.setProperty("thundershows.all_day_events", allDayEvents.checked);
	}

	return true;
}

/**
 * Called when the filter list is clicked on
 * Sets the form objects to the list item's associated Filter values
 */
function cTS_selectFilter() {
	var filterList = document.getElementById("thundershows-filter-list");
	// Currently selected item
	var index = filterList.selectedItem.value;
	
	var filterName = document.getElementById("thundershows-filter-name");
	var filterInclude = document.getElementById("thundershows-filter-include");
	var filterProperty = document.getElementById("thundershows-filter-property");
	var filterType = document.getElementById("thundershows-filter-type");
	var filterExpression = document.getElementById("thundershows-filter-expression");

	// Set the edit filter textbox to the selected value
	filterName.value = gFilters[index].name;
	filterInclude.checked = gFilters[index].include;
	for (var i = 0; i < filterProperty.itemCount; i++) {
		// We need to check each value from the filter property against the
		// stored value since its a string
		if (filterProperty.getItemAtIndex(i).value == gFilters[index].property) {
			filterProperty.selectedIndex = i;
			break;
		}
	}
	filterType.selectedIndex = gFilters[index].type;
	filterExpression.value = gFilters[index].expression;
}

/**
 * Called when the add filter button is clicked
 * Adds a new empty filter
 * Selects the new filter item
 */
function cTS_addFilter() {
	var filterList = document.getElementById("thundershows-filter-list");

	// Create new Filter
	gFilters[filterList.getRowCount()] = new Filter("New Filter",
													"showName",
													true,
													Filter.EQUALS,
													"",
													false);

	// Add filter
	filterList.appendItem("New Filter", filterList.getRowCount());

	// Show last item
	// Ensures that the items value and label are defined (see bug 250123)
	filterList.ensureIndexIsVisible(filterList.getRowCount() - 1);

	// Simulate clicking last item (selects last item)
	filterList.getItemAtIndex(filterList.getRowCount() - 1).click();
}

/**
 * Called when the edit filter button is clicked
 * Sets the currently selected list item's associated Filter properties to the
 * form properties for editing by the user.
 */
function cTS_saveFilter() {
	var filterList = document.getElementById("thundershows-filter-list");
	// Currently selected item
	var index = filterList.selectedItem.value;
	
	var filterName = document.getElementById("thundershows-filter-name");
	var filterInclude = document.getElementById("thundershows-filter-include");
	var filterProperty = document.getElementById("thundershows-filter-property");
	var filterType = document.getElementById("thundershows-filter-type");
	var filterExpression = document.getElementById("thundershows-filter-expression");

	// Update filterList
	filterList.selectedItem.label = filterName.value;

	// Set the filter item from the current values
	gFilters[index].name = filterName.value;
	gFilters[index].include = filterInclude.checked;
	gFilters[index].property = filterProperty.selectedItem.value;
	gFilters[index].type = filterType.selectedIndex;
	gFilters[index].expression = filterExpression.value;
}

/**
 * Called when the remove filter button is clicked
 * Removes the currently selected list item
 * Selects the item above it (if it exists)
 */
function cTS_removeFilter() {
	var filterList = document.getElementById("thundershows-filter-list");
	// Remove the selected item
	var index = filterList.selectedIndex;
	filterList.removeItemAt(index);

	// Remove from filters list
	delete gFilters[index];

	// Choose a new item to select
	if (index > 0) {
		// Choose the row above to select, unless the top row was removed
		index--;
	}

	// Simulate selecting the item (selects that item)
	filterList.getItemAtIndex(index).click();
}

/**
 * Called when the all day events checkbox is clicked
 * Enables/Disables the offset selector
 */
function cTS_toggleAllDayEvents() {
	var allDayEvents = document.getElementById("thundershows-all-day-events-checkbox").checked;
	var offsetGroup = document.getElementById("thundershows-offset-selector");
	offsetGroup.disabled = allDayEvents;
}
