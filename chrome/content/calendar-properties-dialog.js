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
		// Hide elements that can't be changed
		//document.getElementById("calendar-email-identity-row").hidden = true;
		//document.getElementById("read-only").hidden = true;
		//document.getElementById("calendar-cache-row").hidden = true;

		// Populate filter list
		var filterList = document.getElementById("calendar-filter-list");
		var filters = gCalendar.getProperty("thundershows.filters");
		if (filters != null) {
			// Can only do it if filters exist
			filters = filters.split("\u001A");
			for (var i in filters) {
				filterList.appendItem(filters[i], filters[i]);
				// Show the most recent item
				// Ensures that the items value and label are defined
				// (see bug 250123)
				filterList.ensureIndexIsVisible(filterList.getRowCount() - 1);
			}

			// Go back to the first item
			filterList.ensureIndexIsVisible(0);
		}
	} else {
		// Disable elements that are only available to ThunderShows Provider
		var els = document.getElementsByAttribute("thundershows-only-property", "true");
		for (var i = 0; i < els.length; i++) {
			els[i].setAttribute("disable-capability", "true");
		}
	}
}

/**
 * Called when the dialog is accepted, to save settings
 * Note: this does not replace the standard onAcceptDialog()
 */
function cTS_onAcceptDialog() {
	if (gCalendar.type == "thundershows") {
		// Save filters
		var filters;
		var filterList = document.getElementById("calendar-filter-list");
		for (var i = 0; i < filterList.getRowCount(); i++) {
			if (i > 0) {
				// Add separator for all items but first
				filters += "\u001A";
				filters += filterList.getItemAtIndex(i).value;
			} else {
				// Create string (instead of adding to it) for first value
				filters = filterList.getItemAtIndex(i).value;
			}
		}
		gCalendar.setProperty("thundershows.filters", filters);
	}

	return true;
}

/**
 * Called when the filter list is clicked on
 * Sets the textbox text to the list item's value
 */
function cTS_selectFilter() {
	var filterList = document.getElementById("calendar-filter-list");
	var editFilter = document.getElementById("thundershows-edit-filter-textbox");
	// Set the edit filter textbox to the selected value
	editFilter.value = filterList.selectedItem.value;
}

/**
 * Called when the add filter button is clicked
 * Checks if filter is already in the list and adds it if not
 * Clears the textbox
 * Selects newest item
 */
function cTS_addFilter() {
	var filterList = document.getElementById("calendar-filter-list");
	var editFilter = document.getElementById("thundershows-edit-filter-textbox");

	// Add filter
	if (editFilter.value != "" && !doesFilterExist(editFilter.value)) {
		// Only add the filter if it isn't empty && doesn't exist already
		filterList.appendItem(editFilter.value, editFilter.value);
		editFilter.reset();
		// Select last item
		filterList.selectedIndex = filterList.getRowCount() - 1;
		// Show last item
		// Ensures that the items value and label are defined (see bug 250123)
		filterList.ensureIndexIsVisible(filterList.getRowCount() - 1);
	}
}

/**
 * Called when the edit filter button is clicked
 * Sets the currently selected list item's value to the textbox value
 */
function cTS_editFilter() {
	var filterList = document.getElementById("calendar-filter-list");
	var editFilter = document.getElementById("thundershows-edit-filter-textbox");
	var selectedItem = filterList.selectedItem;

	// Edit the filter
	if (editFilter.value != "" && !doesFilterExist(editFilter.value)) {
		selectedItem.label = selectedItem.value = editFilter.value;
	}
}

/**
 * Called when the remove filter button is clicked
 * Removes the currently selected list item
 * Selects the item above it
 */
function cTS_removeFilter() {
	var filterList = document.getElementById("calendar-filter-list");
	// Remove the selected item
	var selectedIndex = filterList.selectedIndex;
	filterList.removeItemAt(selectedIndex);
	
	// Clear the edit box
	document.getElementById("thundershows-edit-filter-textbox").reset();

	// Choose a new item to select
	if (selectedIndex > 0) {
		// Choose the row above to select, unless the top row was removed
		selectedIndex--;
	}
	filterList.selectedItem = filterList.getItemAtIndex(selectedIndex);
}

/**
 * Check if a filter already exists in the list
 * Returns true or false
 */
function doesFilterExist(aFilter) {
	var filterList = document.getElementById("calendar-filter-list");
	for (var i = 0; i < filterList.getRowCount(); i++) {
		if (filterList.getItemAtIndex(i).value == aFilter) {
			return true;
		}
	}
	return false;
}
