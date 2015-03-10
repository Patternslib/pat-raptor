(function(){;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/resizetable.js
function countColumns(tableElement) {
    // calculate current number of columns of a table,
    // taking into account rowspans and colspans

    var tr, td, i, j, k, cs, rs;
    var rowspanLeft = new Array();
    var tableCols = 0;
    var tableRows = tableElement.rows.length;
    i = 0;
    while (i < tableRows) {
        var tr = tableElement.rows[i];
        var j = 0;
        var k = 0;
        // Trace and adjust the cells of this row
        while (j < tr.cells.length || k < rowspanLeft.length) {
            if (rowspanLeft[k]) {
                rowspanLeft[k++]--;
            } else if (j >= tr.cells.length) {
                k++;
            } else {
                td = tr.cells[j++];
                rs = Math.max(1, parseInt(td.rowSpan));
                for (cs = Math.max(1, parseInt(td.colSpan)); cs > 0; cs--) {
                    if (rowspanLeft[k])
                        break; // Overlapping colspan and rowspan cells
                    rowspanLeft[k++] = rs - 1;
                }
            }
        }
        tableCols = Math.max(k, tableCols);
        i++;
    }
    return tableCols;
}

function resizeTable(tableElement, rCount, rStart, cCount, cStart, options) {
    // Insert or remove rows and columns in the table, taking into account
    // rowspans and colspans
    // Parameters:
    //   tableElement: DOM element representing existing table to be modified
    //   rCount:       number of rows to add (if >0) or delete (if <0)
    //   rStart:       number of row where rows should be added/deleted
    //   cCount:       number of columns to add (if >0) or delete (if <0)
    //   cStart:       number of column where columns should be added/deleted
    //   cCount
    //   cStart
    var tr, td, i, j, k, l, cs, rs;
    var rowspanLeft = [];
    var rowspanCell = [];
    var tableRows0 = tableElement.rows.length;
    var tableCols0 = countColumns(tableElement);
    var cells = [];

    if (rCount > 0) { // Prep insertion of rows
        for (i = rStart; i < rStart + rCount; i++) {
            tableElement.insertRow(i);
        }
    }
    i = 0;
    while (i < tableRows0) {
        var tr = tableElement.rows[i];
        var j = 0;
        var k = 0;
        // Trace and adjust the cells of this row
        while (k < tableCols0) {
            if (cCount > 0 && k === cStart) { // Insert columns by inserting cells
                for (l = 0; l < cCount; l++) {  // between/before existing cells
                    cells.push(insertEmptyCell(tr, j++, options.placeHolder));
                }
            }
            if (rowspanLeft[k]) {
                if (rCount < 0
                        && i === rStart - rCount && rowspanCell[k]
                        && rowspanCell[k].rowSpan == 1) {
                    // This is the first row after a series of to-be-deleted rows.
                    // Any rowspan-cells covering this row which started in the
                    // to-be-deleted rows have to be moved into this row, with
                    // rowspan adjusted. All such cells are marked td.rowSpan==1.
                    td = rowspanCell[k];
                    if (j >= tr.cells.length) {
                        tr.appendChild(td);
                    } else {
                        tr.insertBefore(td, tr.cells[j]);
                    }
                    j++;
                    rs = td.rowSpan = rowspanLeft[k];
                    for (cs = Math.max(1, parseInt(td.colSpan)); cs > 0; --cs) {
                        rowspanLeft[k++] = rs - 1;
                    }
                } else {
                    if (--rowspanLeft[k++] === 0)
                        rowspanCell[k] = null;
                    while (rowspanLeft[k] && !rowspanCell[k]) {
                        // This is a cell of a block with both rowspan and colspan>1
                        // Handle all remaining cells in this row of the block, so as to
                        // avoid inserting cells which are already covered by the block
                        --rowspanLeft[k++];
                    }
                }
            } else {
                if (j >= tr.cells.length) {
                    cells.push(insertEmptyCell(tr, j, options.placeHolder)); // append missing cell
                }
                td = tr.cells[j++];
                rs = Math.max(1, parseInt(td.rowSpan));
                if (rs > 1) {
                    rowspanCell[k] = td;
                    if (rCount < 0 && i >= rStart && i < rStart - rCount) {//row is to-be-deleted
                        td.rowSpan = 1; // Mark cell as to-be-moved-down-later
                    }
                }
                var k0 = k;
                for (cs = Math.max(1, parseInt(td.colSpan)); cs > 0; --cs) {
                    if (rowspanLeft[k]) { // Overlapping colspan and rowspan cells
                        td.colSpan -= cs; // Set adjustment into table
                        break;
                    }
                    rowspanLeft[k++] = rs - 1;
                }
                if (rCount < 0 && i >= rStart && i < rStart - rCount) {
                    // This row is to be deleted: do not insert/remove columns,
                    // but preserve row as-is so we can move cells down later on
                } else if (cCount > 0 && k > cStart && k0 < cStart) {
                    td.colSpan += cCount; // Insert columns by widening cell
                } else if (cCount < 0 && k0 < cStart - cCount && k > cStart) {
                    // Delete columns in overlap of [k0,k> and [cStart,cStart-cCount>
                    var newColSpan = Math.max(0, cStart - k0) + Math.max(0, k - (cStart - cCount));
                    if (newColSpan) {
                        // .. by reducing width of cell containing to-be-deleted columns
                        td.colSpan = newColSpan;
                    } else {
                        // .. by removing fully-encompassed cell
                        tr.deleteCell(--j);
                    }
                }
            }
        }
        if (cCount > 0 && k === cStart) { // Insert columns by appending cells to row
            for (l = 0; l < cCount; l++) {
                cells.push(insertEmptyCell(tr, j++, options.placeHolder));
            }
        }
        i++;
        if (rCount > 0 && i === rStart) {
            // Adjust rowspans present at start of inserted rows
            for (l = 0; l < tableCols0; l++) {
                if (rowspanLeft[l])
                    rowspanLeft[l] += rCount;
                if (rowspanCell[l])
                    rowspanCell[l].rowSpan += rCount;
            }
        } else if (rCount < 0 && i === rStart) {
            // Adjust rowspans present at start of to-be-deleted rows
            for (l = 0; l < rowspanCell.length; l++) {
                if (rowspanCell[l]) {
                    rowspanCell[l].rowSpan -= Math.min(-rCount, rowspanLeft[l]);
                }
            }
        }
    }
    if (rCount < 0) {
        for (i = rStart; i < rStart - rCount; i++) {
            tableElement.deleteRow(i);
        }
    }
    return cells;
}

function insertEmptyCell(row, index, placeHolder) {
    var sibling, cell;
    // Check the cell's sibling to detect header cells
    if (index > 0) {
        sibling = row.cells[index - 1];
    } else if (index < row.cells.length) {
        sibling = row.cells[index + 1];
    }

    // Header cell
    cell = row.insertCell(index);
    if (sibling && sibling.tagName === 'TH') {
        var header = document.createElement('th');
        if (placeHolder) {
            header.innerHTML = placeHolder;
        }
        $(cell).replaceWith(header)
    } else if (placeHolder) {
        cell.innerHTML = placeHolder;
    }
    return cell;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/resizetable.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/goog-table.js
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// https://code.google.com/p/closure-library/source/browse/closure/goog/editor/table.js
//
// Modified by David Neilsen <david@panmedia.co.nz>

/**
 * Class providing high level table editing functions.
 * @param {Element} node Element that is a table or descendant of a table.
 * @constructor
 */
GoogTable = function(node) {
    this.element = node;
    this.refresh();
};


/**
 * Walks the dom structure of this object's table element and populates
 * this.rows with GoogTableRow objects. This is done initially
 * to populate the internal data structures, and also after each time the
 * DOM structure is modified. Currently this means that the all existing
 * information is discarded and re-read from the DOM.
 */
// TODO(user): support partial refresh to save cost of full update
// every time there is a change to the DOM.
GoogTable.prototype.refresh = function() {
    var rows = this.rows = [];
    var tbody = this.element.tBodies[0];
    if (!tbody) {
        return;
    }
    var trs = [];
    for (var child = tbody.firstChild; child; child = child.nextSibling) {
        if (child.tagName === 'TR') {
            trs.push(child);
        }
    }

    for (var rowNum = 0, tr; tr = trs[rowNum]; rowNum++) {
        var existingRow = rows[rowNum];
        var tds = GoogTable.getChildCellElements(tr);
        var columnNum = 0;
        // A note on cellNum vs. columnNum: A cell is a td/th element. Cells may
        // use colspan/rowspan to extend over multiple rows/columns. cellNum
        // is the dom element number, columnNum is the logical column number.
        for (var cellNum = 0, td; td = tds[cellNum]; cellNum++) {
            // If there's already a cell extending into this column
            // (due to that cell's colspan/rowspan), increment the column counter.
            while (existingRow && existingRow.columns[columnNum]) {
                columnNum++;
            }
            var cell = new GoogTableCell(td, rowNum, columnNum);
            // Place this cell in every row and column into which it extends.
            for (var i = 0; i < cell.rowSpan; i++) {
                var cellRowNum = rowNum + i;
                // Create TableRow objects in this.rows as needed.
                var cellRow = rows[cellRowNum];
                if (!cellRow) {
                    // TODO(user): try to avoid second trs[] lookup.
                    rows.push(
                            cellRow = new GoogTableRow(trs[cellRowNum], cellRowNum));
                }
                // Extend length of column array to make room for this cell.
                var minimumColumnLength = columnNum + cell.colSpan;
                if (cellRow.columns.length < minimumColumnLength) {
                    cellRow.columns.length = minimumColumnLength;
                }
                for (var j = 0; j < cell.colSpan; j++) {
                    var cellColumnNum = columnNum + j;
                    cellRow.columns[cellColumnNum] = cell;
                }
            }
            columnNum += cell.colSpan;
        }
    }
};


/**
 * Returns all child elements of a TR element that are of type TD or TH.
 * @param {Element} tr TR element in which to find children.
 * @return {Array.<Element>} array of child cell elements.
 */
GoogTable.getChildCellElements = function(tr) {
    var cells = [];
    for (var i = 0, cell; cell = tr.childNodes[i]; i++) {
        if (cell.tagName === 'TD' ||
                cell.tagName === 'TH') {
            cells.push(cell);
        }
    }
    return cells;
};


/**
 * Inserts a new row in the table. The row will be populated with new
 * cells, and existing rowspanned cells that overlap the new row will
 * be extended.
 * @param {number=} rowIndex Index at which to insert the row. If
 *     this is omitted the row will be appended to the end of the table.
 * @return {Element} The new row.
 */
GoogTable.prototype.insertRow = function(rowIndex, options) {
    var rowIndex = rowIndex || this.rows.length;
    var refRow;
    var insertAfter;
    if (rowIndex == 0) {
        refRow = this.rows[0];
        insertAfter = false;
    } else {
        refRow = this.rows[rowIndex - 1];
        insertAfter = true;
    }
    var newTr = document.createElement('tr');
    for (var i = 0, cell; cell = refRow.columns[i]; i += 1) {
        // Check whether the existing cell will span this new row.
        // If so, instead of creating a new cell, extend
        // the rowspan of the existing cell.
        if ((insertAfter && cell.endRow > rowIndex) ||
            (!insertAfter && cell.startRow < rowIndex)) {
            cell.setRowSpan(cell.rowSpan + 1);
            if (cell.colSpan > 1) {
                i += cell.colSpan - 1;
            }
        } else {
            var newTd = document.createElement('td');
            newTd.innerHTML = options.placeHolder;
            newTr.appendChild(newTd);
        }
        if (insertAfter) {
            refRow.element.parentNode.insertBefore(newTr, refRow.element.nextSibling);
        } else {
            refRow.element.insertBefore(newTr);
        }
    }
    this.refresh();
    return newTr;
};


/**
 * Inserts a new column in the table. The column will be created by
 * inserting new TD elements in each row, or extending the colspan
 * of existing TD elements.
 * @param {number=} colIndex Index at which to insert the column. If
 *     this is omitted the column will be appended to the right side of
 *     the table.
 * @return {Array.<Element>} Array of new cell elements that were created
 *     to populate the new column.
 */
//GoogTable.prototype.insertColumn = function(colIndex, options) {
//    // TODO(user): set column widths in a way that makes sense.
//    var colIndex = colIndex || ((this.rows[0] && this.rows[0].columns.length) || 0);
//    var newTds = [];
//    for (var rowNum = 0, row; row = this.rows[rowNum]; rowNum++) {
//        var existingCell = row.columns[colIndex];
//        if (existingCell && existingCell.endCol >= colIndex &&
//            existingCell.startCol < colIndex) {
//            existingCell.setColSpan(existingCell.colSpan + 1);
//            rowNum += existingCell.rowSpan - 1;
//        } else {
//            var newTd = document.createElement('td');
//            newTd.innerHTML = options.placeHolder;
//            this.insertCellElement(newTd, rowNum, colIndex);
//            newTds.push(newTd);
//        }
//    }
//    this.refresh();
//    return newTds;
//};

/**
 * Merges multiple cells into a single cell, and sets the rowSpan and colSpan
 * attributes of the cell to take up the same space as the original cells.
 * @param {number} startRowIndex Top coordinate of the cells to merge.
 * @param {number} startColIndex Left coordinate of the cells to merge.
 * @param {number} endRowIndex Bottom coordinate of the cells to merge.
 * @param {number} endColIndex Right coordinate of the cells to merge.
 * @return {boolean} Whether or not the merge was possible. If the cells
 *     in the supplied coordinates can't be merged this will return false.
 */
GoogTable.prototype.mergeCells = function(
        startRowIndex, startColIndex, endRowIndex, endColIndex) {
    // TODO(user): take a single goog.math.Rect parameter instead?
    var cells = [];
    var cell;
    if (startRowIndex == endRowIndex && startColIndex == endColIndex) {
        // <strict>
        handleError("Can't merge single cell");
        // </strict>
        return false;
    }
    // Gather cells and do sanity check.
    for (var i = startRowIndex; i <= endRowIndex; i++) {
        for (var j = startColIndex; j <= endColIndex; j++) {
            cell = this.rows[i].columns[j];
            if (cell.startRow < startRowIndex ||
                    cell.endRow > endRowIndex ||
                    cell.startCol < startColIndex ||
                    cell.endCol > endColIndex) {
                // <strict>
                handleError(
                        "Can't merge cells: the cell in row " + i + ', column ' + j +
                        'extends outside the supplied rectangle.');
                // </strict>
                return false;
            }
            // TODO(user): this is somewhat inefficient, as we will add
            // a reference for a cell for each position, even if it's a single
            // cell with row/colspan.
            cells.push(cell);
        }
    }
    var targetCell = cells[0];
    var targetTd = targetCell.element;
    var doc = document;

    // Merge cell contents and discard other cells.
    for (var i = 1; cell = cells[i]; i++) {
        var td = cell.element;
        if (!td.parentNode || td == targetTd) {
            // We've already handled this cell at one of its previous positions.
            continue;
        }
        // Add a space if needed, to keep merged content from getting squished
        // together.
        if (targetTd.lastChild &&
                targetTd.lastChild.nodeType === Node.TEXT_NODE) {
            targetTd.appendChild(doc.createElement('br'));
        }
        var childNode;
        while ((childNode = td.firstChild)) {
            targetTd.appendChild(childNode);
        }
        td.parentNode.removeChild(td);
    }
    targetCell.setColSpan((endColIndex - startColIndex) + 1);
    targetCell.setRowSpan((endRowIndex - startRowIndex) + 1);
    this.refresh();

    return true;
};


/**
 * Splits a cell with colspans or rowspans into multiple descrete cells.
 * @param {number} rowIndex y coordinate of the cell to split.
 * @param {number} colIndex x coordinate of the cell to split.
 * @return {Array.<Element>} Array of new cell elements created by splitting
 *     the cell.
 */
// TODO(user): support splitting only horizontally or vertically,
// support splitting cells that aren't already row/colspanned.
GoogTable.prototype.splitCell = function(rowIndex, colIndex) {
    var row = this.rows[rowIndex];
    var cell = row.columns[colIndex];
    var newTds = [];
    var html = cell.element.innerHTML;
    for (var i = 0; i < cell.rowSpan; i++) {
        for (var j = 0; j < cell.colSpan; j++) {
            if (i > 0 || j > 0) {
                var newTd = document.createElement('td');
                this.insertCellElement(newTd, rowIndex + i, colIndex + j);
                newTds.push(newTd);
            }
        }
    }
    cell.setColSpan(1);
    cell.setRowSpan(1);
    // Set first cell HTML
    newTds[0].innerHTML = html;
    cell.element.innerHTML = '';
    this.refresh();
    return newTds;
};


/**
 * Inserts a cell element at the given position. The colIndex is the logical
 * column index, not the position in the dom. This takes into consideration
 * that cells in a given logical  row may actually be children of a previous
 * DOM row that have used rowSpan to extend into the row.
 * @param {Element} td The new cell element to insert.
 * @param {number} rowIndex Row in which to insert the element.
 * @param {number} colIndex Column in which to insert the element.
 */
GoogTable.prototype.insertCellElement = function(
        td, rowIndex, colIndex) {
    var row = this.rows[rowIndex];
    var nextSiblingElement = null;
    for (var i = colIndex, cell; cell = row.columns[i]; i += cell.colSpan) {
        if (cell.startRow == rowIndex) {
            nextSiblingElement = cell.element;
            break;
        }
    }
    row.element.insertBefore(td, nextSiblingElement);
};


/**
 * Class representing a logical table row: a tr element and any cells
 * that appear in that row.
 * @param {Element} trElement This rows's underlying TR element.
 * @param {number} rowIndex This row's index in its parent table.
 * @constructor
 */
GoogTableRow = function(trElement, rowIndex) {
    this.index = rowIndex;
    this.element = trElement;
    this.columns = [];
};



/**
 * Class representing a table cell, which may span across multiple
 * rows and columns
 * @param {Element} td This cell's underlying TD or TH element.
 * @param {number} startRow Index of the row where this cell begins.
 * @param {number} startCol Index of the column where this cell begins.
 * @constructor
 */
GoogTableCell = function(td, startRow, startCol) {
    this.element = td;
    this.colSpan = parseInt(td.colSpan, 10) || 1;
    this.rowSpan = parseInt(td.rowSpan, 10) || 1;
    this.startRow = startRow;
    this.startCol = startCol;
    this.updateCoordinates_();
};


/**
 * Calculates this cell's endRow/endCol coordinates based on rowSpan/colSpan
 * @private
 */
GoogTableCell.prototype.updateCoordinates_ = function() {
    this.endCol = this.startCol + this.colSpan - 1;
    this.endRow = this.startRow + this.rowSpan - 1;
};


/**
 * Set this cell's colSpan, updating both its colSpan property and the
 * underlying element's colSpan attribute.
 * @param {number} colSpan The new colSpan.
 */
GoogTableCell.prototype.setColSpan = function(colSpan) {
    if (colSpan != this.colSpan) {
        if (colSpan > 1) {
            this.element.colSpan = colSpan;
        } else {
            this.element.colSpan = 1,
                    this.element.removeAttribute('colSpan');
        }
        this.colSpan = colSpan;
        this.updateCoordinates_();
    }
};


/**
 * Set this cell's rowSpan, updating both its rowSpan property and the
 * underlying element's rowSpan attribute.
 * @param {number} rowSpan The new rowSpan.
 */
GoogTableCell.prototype.setRowSpan = function(rowSpan) {
    if (rowSpan != this.rowSpan) {
        if (rowSpan > 1) {
            this.element.rowSpan = rowSpan.toString();
        } else {
            this.element.rowSpan = '1';
            this.element.removeAttribute('rowSpan');
        }
        this.rowSpan = rowSpan;
        this.updateCoordinates_();
    }
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/goog-table.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.js
/*1.5.7*/
(function() {
    var f = 0, k = [], m = {}, i = {}, a = {"<": "lt", ">": "gt", "&": "amp", '"': "quot", "'": "#39"}, l = /[<>&\"\']/g, b, c = window.setTimeout, d = {}, e;
    function h() {
        this.returnValue = false
    }
    function j() {
        this.cancelBubble = true
    }
    (function(n) {
        var o = n.split(/,/), p, r, q;
        for (p = 0; p < o.length; p += 2) {
            q = o[p + 1].split(/ /);
            for (r = 0; r < q.length; r++) {
                i[q[r]] = o[p]
            }
        }
    })("application/msword,doc dot,application/pdf,pdf,application/pgp-signature,pgp,application/postscript,ps ai eps,application/rtf,rtf,application/vnd.ms-excel,xls xlb,application/vnd.ms-powerpoint,ppt pps pot,application/zip,zip,application/x-shockwave-flash,swf swfl,application/vnd.openxmlformats-officedocument.wordprocessingml.document,docx,application/vnd.openxmlformats-officedocument.wordprocessingml.template,dotx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,xlsx,application/vnd.openxmlformats-officedocument.presentationml.presentation,pptx,application/vnd.openxmlformats-officedocument.presentationml.template,potx,application/vnd.openxmlformats-officedocument.presentationml.slideshow,ppsx,application/x-javascript,js,application/json,json,audio/mpeg,mpga mpega mp2 mp3,audio/x-wav,wav,audio/mp4,m4a,image/bmp,bmp,image/gif,gif,image/jpeg,jpeg jpg jpe,image/photoshop,psd,image/png,png,image/svg+xml,svg svgz,image/tiff,tiff tif,text/plain,asc txt text diff log,text/html,htm html xhtml,text/css,css,text/csv,csv,text/rtf,rtf,video/mpeg,mpeg mpg mpe m2v,video/quicktime,qt mov,video/mp4,mp4,video/x-m4v,m4v,video/x-flv,flv,video/x-ms-wmv,wmv,video/avi,avi,video/webm,webm,video/3gpp,3gp,video/3gpp2,3g2,video/vnd.rn-realvideo,rv,application/vnd.oasis.opendocument.formula-template,otf,application/octet-stream,exe");
    var g = {VERSION: "1.5.7", STOPPED: 1, STARTED: 2, QUEUED: 1, UPLOADING: 2, FAILED: 4, DONE: 5, GENERIC_ERROR: -100, HTTP_ERROR: -200, IO_ERROR: -300, SECURITY_ERROR: -400, INIT_ERROR: -500, FILE_SIZE_ERROR: -600, FILE_EXTENSION_ERROR: -601, IMAGE_FORMAT_ERROR: -700, IMAGE_MEMORY_ERROR: -701, IMAGE_DIMENSIONS_ERROR: -702, mimeTypes: i, ua: (function() {
            var r = navigator, q = r.userAgent, s = r.vendor, o, n, p;
            o = /WebKit/.test(q);
            p = o && s.indexOf("Apple") !== -1;
            n = window.opera && window.opera.buildNumber;
            return{windows: navigator.platform.indexOf("Win") !== -1, android: /Android/.test(q), ie: !o && !n && (/MSIE/gi).test(q) && (/Explorer/gi).test(r.appName), webkit: o, gecko: !o && /Gecko/.test(q), safari: p, opera: !!n}
        }()), typeOf: function(n) {
            return({}).toString.call(n).match(/\s([a-z|A-Z]+)/)[1].toLowerCase()
        }, extend: function(n) {
            g.each(arguments, function(o, p) {
                if (p > 0) {
                    g.each(o, function(r, q) {
                        n[q] = r
                    })
                }
            });
            return n
        }, cleanName: function(n) {
            var o, p;
            p = [/[\300-\306]/g, "A", /[\340-\346]/g, "a", /\307/g, "C", /\347/g, "c", /[\310-\313]/g, "E", /[\350-\353]/g, "e", /[\314-\317]/g, "I", /[\354-\357]/g, "i", /\321/g, "N", /\361/g, "n", /[\322-\330]/g, "O", /[\362-\370]/g, "o", /[\331-\334]/g, "U", /[\371-\374]/g, "u"];
            for (o = 0; o < p.length; o += 2) {
                n = n.replace(p[o], p[o + 1])
            }
            n = n.replace(/\s+/g, "_");
            n = n.replace(/[^a-z0-9_\-\.]+/gi, "");
            return n
        }, addRuntime: function(n, o) {
            o.name = n;
            k[n] = o;
            k.push(o);
            return o
        }, guid: function() {
            var n = new Date().getTime().toString(32), o;
            for (o = 0; o < 5; o++) {
                n += Math.floor(Math.random() * 65535).toString(32)
            }
            return(g.guidPrefix || "p") + n + (f++).toString(32)
        }, buildUrl: function(o, n) {
            var p = "";
            g.each(n, function(r, q) {
                p += (p ? "&" : "") + encodeURIComponent(q) + "=" + encodeURIComponent(r)
            });
            if (p) {
                o += (o.indexOf("?") > 0 ? "&" : "?") + p
            }
            return o
        }, each: function(q, r) {
            var p, o, n;
            if (q) {
                p = q.length;
                if (p === b) {
                    for (o in q) {
                        if (q.hasOwnProperty(o)) {
                            if (r(q[o], o) === false) {
                                return
                            }
                        }
                    }
                } else {
                    for (n = 0; n < p; n++) {
                        if (r(q[n], n) === false) {
                            return
                        }
                    }
                }
            }
        }, formatSize: function(n) {
            if (n === b || /\D/.test(n)) {
                return g.translate("N/A")
            }
            if (n > 1073741824) {
                return Math.round(n / 1073741824, 1) + " GB"
            }
            if (n > 1048576) {
                return Math.round(n / 1048576, 1) + " MB"
            }
            if (n > 1024) {
                return Math.round(n / 1024, 1) + " KB"
            }
            return n + " b"
        }, getPos: function(o, s) {
            var t = 0, r = 0, v, u = document, p, q;
            o = o;
            s = s || u.body;
            function n(B) {
                var z, A, w = 0, C = 0;
                if (B) {
                    A = B.getBoundingClientRect();
                    z = u.compatMode === "CSS1Compat" ? u.documentElement : u.body;
                    w = A.left + z.scrollLeft;
                    C = A.top + z.scrollTop
                }
                return{x: w, y: C}
            }
            if (o && o.getBoundingClientRect && g.ua.ie && (!u.documentMode || u.documentMode < 8)) {
                p = n(o);
                q = n(s);
                return{x: p.x - q.x, y: p.y - q.y}
            }
            v = o;
            while (v && v != s && v.nodeType) {
                t += v.offsetLeft || 0;
                r += v.offsetTop || 0;
                v = v.offsetParent
            }
            v = o.parentNode;
            while (v && v != s && v.nodeType) {
                t -= v.scrollLeft || 0;
                r -= v.scrollTop || 0;
                v = v.parentNode
            }
            return{x: t, y: r}
        }, getSize: function(n) {
            return{w: n.offsetWidth || n.clientWidth, h: n.offsetHeight || n.clientHeight}
        }, parseSize: function(n) {
            var o;
            if (typeof (n) == "string") {
                n = /^([0-9]+)([mgk]?)$/.exec(n.toLowerCase().replace(/[^0-9mkg]/g, ""));
                o = n[2];
                n = +n[1];
                if (o == "g") {
                    n *= 1073741824
                }
                if (o == "m") {
                    n *= 1048576
                }
                if (o == "k") {
                    n *= 1024
                }
            }
            return n
        }, xmlEncode: function(n) {
            return n ? ("" + n).replace(l, function(o) {
                return a[o] ? "&" + a[o] + ";" : o
            }) : n
        }, toArray: function(p) {
            var o, n = [];
            for (o = 0; o < p.length; o++) {
                n[o] = p[o]
            }
            return n
        }, inArray: function(p, q) {
            if (q) {
                if (Array.prototype.indexOf) {
                    return Array.prototype.indexOf.call(q, p)
                }
                for (var n = 0, o = q.length; n < o; n++) {
                    if (q[n] === p) {
                        return n
                    }
                }
            }
            return -1
        }, addI18n: function(n) {
            return g.extend(m, n)
        }, translate: function(n) {
            return m[n] || n
        }, isEmptyObj: function(n) {
            if (n === b) {
                return true
            }
            for (var o in n) {
                return false
            }
            return true
        }, hasClass: function(p, o) {
            var n;
            if (p.className == "") {
                return false
            }
            n = new RegExp("(^|\\s+)" + o + "(\\s+|$)");
            return n.test(p.className)
        }, addClass: function(o, n) {
            if (!g.hasClass(o, n)) {
                o.className = o.className == "" ? n : o.className.replace(/\s+$/, "") + " " + n
            }
        }, removeClass: function(p, o) {
            var n = new RegExp("(^|\\s+)" + o + "(\\s+|$)");
            p.className = p.className.replace(n, function(r, q, s) {
                return q === " " && s === " " ? " " : ""
            })
        }, getStyle: function(o, n) {
            if (o.currentStyle) {
                return o.currentStyle[n]
            } else {
                if (window.getComputedStyle) {
                    return window.getComputedStyle(o, null)[n]
                }
            }
        }, addEvent: function(s, n, t) {
            var r, q, p, o;
            o = arguments[3];
            n = n.toLowerCase();
            if (e === b) {
                e = "Plupload_" + g.guid()
            }
            if (s.addEventListener) {
                r = t;
                s.addEventListener(n, r, false)
            } else {
                if (s.attachEvent) {
                    r = function() {
                        var u = window.event;
                        if (!u.target) {
                            u.target = u.srcElement
                        }
                        u.preventDefault = h;
                        u.stopPropagation = j;
                        t(u)
                    };
                    s.attachEvent("on" + n, r)
                }
            }
            if (s[e] === b) {
                s[e] = g.guid()
            }
            if (!d.hasOwnProperty(s[e])) {
                d[s[e]] = {}
            }
            q = d[s[e]];
            if (!q.hasOwnProperty(n)) {
                q[n] = []
            }
            q[n].push({func: r, orig: t, key: o})
        }, removeEvent: function(s, n) {
            var q, t, p;
            if (typeof (arguments[2]) == "function") {
                t = arguments[2]
            } else {
                p = arguments[2]
            }
            n = n.toLowerCase();
            if (s[e] && d[s[e]] && d[s[e]][n]) {
                q = d[s[e]][n]
            } else {
                return
            }
            for (var o = q.length - 1; o >= 0; o--) {
                if (q[o].key === p || q[o].orig === t) {
                    if (s.removeEventListener) {
                        s.removeEventListener(n, q[o].func, false)
                    } else {
                        if (s.detachEvent) {
                            s.detachEvent("on" + n, q[o].func)
                        }
                    }
                    q[o].orig = null;
                    q[o].func = null;
                    q.splice(o, 1);
                    if (t !== b) {
                        break
                    }
                }
            }
            if (!q.length) {
                delete d[s[e]][n]
            }
            if (g.isEmptyObj(d[s[e]])) {
                delete d[s[e]];
                try {
                    delete s[e]
                } catch (r) {
                    s[e] = b
                }
            }
        }, removeAllEvents: function(o) {
            var n = arguments[1];
            if (o[e] === b || !o[e]) {
                return
            }
            g.each(d[o[e]], function(q, p) {
                g.removeEvent(o, p, n)
            })
        }};
    g.Uploader = function(r) {
        var o = {}, u, t = [], q, p = false;
        u = new g.QueueProgress();
        r = g.extend({chunk_size: 0, multipart: true, multi_selection: true, file_data_name: "file", filters: []}, r);
        function s() {
            var w, x = 0, v;
            if (this.state == g.STARTED) {
                for (v = 0; v < t.length; v++) {
                    if (!w && t[v].status == g.QUEUED) {
                        w = t[v];
                        w.status = g.UPLOADING;
                        if (this.trigger("BeforeUpload", w)) {
                            this.trigger("UploadFile", w)
                        }
                    } else {
                        x++
                    }
                }
                if (x == t.length) {
                    this.stop();
                    this.trigger("UploadComplete", t)
                }
            }
        }
        function n() {
            var w, v;
            u.reset();
            for (w = 0; w < t.length; w++) {
                v = t[w];
                if (v.size !== b) {
                    u.size += v.size;
                    u.loaded += v.loaded
                } else {
                    u.size = b
                }
                if (v.status == g.DONE) {
                    u.uploaded++
                } else {
                    if (v.status == g.FAILED) {
                        u.failed++
                    } else {
                        u.queued++
                    }
                }
            }
            if (u.size === b) {
                u.percent = t.length > 0 ? Math.ceil(u.uploaded / t.length * 100) : 0
            } else {
                u.bytesPerSec = Math.ceil(u.loaded / ((+new Date() - q || 1) / 1000));
                u.percent = u.size > 0 ? Math.ceil(u.loaded / u.size * 100) : 0
            }
        }
        g.extend(this, {state: g.STOPPED, runtime: "", features: {}, files: t, settings: r, total: u, id: g.guid(), init: function() {
                var A = this, B, x, w, z = 0, y;
                if (typeof (r.preinit) == "function") {
                    r.preinit(A)
                } else {
                    g.each(r.preinit, function(D, C) {
                        A.bind(C, D)
                    })
                }
                r.page_url = r.page_url || document.location.pathname.replace(/\/[^\/]+$/g, "/");
                if (!/^(\w+:\/\/|\/)/.test(r.url)) {
                    r.url = r.page_url + r.url
                }
                r.chunk_size = g.parseSize(r.chunk_size);
                r.max_file_size = g.parseSize(r.max_file_size);
                A.bind("FilesAdded", function(C, F) {
                    var E, D, H = 0, I, G = r.filters;
                    if (G && G.length) {
                        I = [];
                        g.each(G, function(J) {
                            g.each(J.extensions.split(/,/), function(K) {
                                if (/^\s*\*\s*$/.test(K)) {
                                    I.push("\\.*")
                                } else {
                                    I.push("\\." + K.replace(new RegExp("[" + ("/^$.*+?|()[]{}\\".replace(/./g, "\\$&")) + "]", "g"), "\\$&"))
                                }
                            })
                        });
                        I = new RegExp(I.join("|") + "$", "i")
                    }
                    for (E = 0; E < F.length; E++) {
                        D = F[E];
                        D.loaded = 0;
                        D.percent = 0;
                        D.status = g.QUEUED;
                        if (I && !I.test(D.name)) {
                            C.trigger("Error", {code: g.FILE_EXTENSION_ERROR, message: g.translate("File extension error."), file: D});
                            continue
                        }
                        if (D.size !== b && D.size > r.max_file_size) {
                            C.trigger("Error", {code: g.FILE_SIZE_ERROR, message: g.translate("File size error."), file: D});
                            continue
                        }
                        t.push(D);
                        H++
                    }
                    if (H) {
                        c(function() {
                            A.trigger("QueueChanged");
                            A.refresh()
                        }, 1)
                    } else {
                        return false
                    }
                });
                if (r.unique_names) {
                    A.bind("UploadFile", function(C, D) {
                        var F = D.name.match(/\.([^.]+)$/), E = "tmp";
                        if (F) {
                            E = F[1]
                        }
                        D.target_name = D.id + "." + E
                    })
                }
                A.bind("UploadProgress", function(C, D) {
                    D.percent = D.size > 0 ? Math.ceil(D.loaded / D.size * 100) : 100;
                    n()
                });
                A.bind("StateChanged", function(C) {
                    if (C.state == g.STARTED) {
                        q = (+new Date())
                    } else {
                        if (C.state == g.STOPPED) {
                            for (B = C.files.length - 1; B >= 0; B--) {
                                if (C.files[B].status == g.UPLOADING) {
                                    C.files[B].status = g.QUEUED;
                                    n()
                                }
                            }
                        }
                    }
                });
                A.bind("QueueChanged", n);
                A.bind("Error", function(C, D) {
                    if (D.file) {
                        D.file.status = g.FAILED;
                        n();
                        if (C.state == g.STARTED) {
                            c(function() {
                                s.call(A)
                            }, 1)
                        }
                    }
                });
                A.bind("FileUploaded", function(C, D) {
                    D.status = g.DONE;
                    D.loaded = D.size;
                    C.trigger("UploadProgress", D);
                    c(function() {
                        s.call(A)
                    }, 1)
                });
                if (r.runtimes) {
                    x = [];
                    y = r.runtimes.split(/\s?,\s?/);
                    for (B = 0; B < y.length; B++) {
                        if (k[y[B]]) {
                            x.push(k[y[B]])
                        }
                    }
                } else {
                    x = k
                }
                function v() {
                    var F = x[z++], E, C, D;
                    if (F) {
                        E = F.getFeatures();
                        C = A.settings.required_features;
                        if (C) {
                            C = C.split(",");
                            for (D = 0; D < C.length; D++) {
                                if (!E[C[D]]) {
                                    v();
                                    return
                                }
                            }
                        }
                        F.init(A, function(G) {
                            if (G && G.success) {
                                A.features = E;
                                A.runtime = F.name;
                                A.trigger("Init", {runtime: F.name});
                                A.trigger("PostInit");
                                A.refresh()
                            } else {
                                v()
                            }
                        })
                    } else {
                        A.trigger("Error", {code: g.INIT_ERROR, message: g.translate("Init error.")})
                    }
                }
                v();
                if (typeof (r.init) == "function") {
                    r.init(A)
                } else {
                    g.each(r.init, function(D, C) {
                        A.bind(C, D)
                    })
                }
            }, refresh: function() {
                this.trigger("Refresh")
            }, start: function() {
                if (t.length && this.state != g.STARTED) {
                    this.state = g.STARTED;
                    this.trigger("StateChanged");
                    s.call(this)
                }
            }, stop: function() {
                if (this.state != g.STOPPED) {
                    this.state = g.STOPPED;
                    this.trigger("CancelUpload");
                    this.trigger("StateChanged")
                }
            }, disableBrowse: function() {
                p = arguments[0] !== b ? arguments[0] : true;
                this.trigger("DisableBrowse", p)
            }, getFile: function(w) {
                var v;
                for (v = t.length - 1; v >= 0; v--) {
                    if (t[v].id === w) {
                        return t[v]
                    }
                }
            }, removeFile: function(w) {
                var v;
                for (v = t.length - 1; v >= 0; v--) {
                    if (t[v].id === w.id) {
                        return this.splice(v, 1)[0]
                    }
                }
            }, splice: function(x, v) {
                var w;
                w = t.splice(x === b ? 0 : x, v === b ? t.length : v);
                this.trigger("FilesRemoved", w);
                this.trigger("QueueChanged");
                return w
            }, trigger: function(w) {
                var y = o[w.toLowerCase()], x, v;
                if (y) {
                    v = Array.prototype.slice.call(arguments);
                    v[0] = this;
                    for (x = 0; x < y.length; x++) {
                        if (y[x].func.apply(y[x].scope, v) === false) {
                            return false
                        }
                    }
                }
                return true
            }, hasEventListener: function(v) {
                return !!o[v.toLowerCase()]
            }, bind: function(v, x, w) {
                var y;
                v = v.toLowerCase();
                y = o[v] || [];
                y.push({func: x, scope: w || this});
                o[v] = y
            }, unbind: function(v) {
                v = v.toLowerCase();
                var y = o[v], w, x = arguments[1];
                if (y) {
                    if (x !== b) {
                        for (w = y.length - 1; w >= 0; w--) {
                            if (y[w].func === x) {
                                y.splice(w, 1);
                                break
                            }
                        }
                    } else {
                        y = []
                    }
                    if (!y.length) {
                        delete o[v]
                    }
                }
            }, unbindAll: function() {
                var v = this;
                g.each(o, function(x, w) {
                    v.unbind(w)
                })
            }, destroy: function() {
                this.stop();
                this.trigger("Destroy");
                this.unbindAll()
            }})
    };
    g.File = function(q, o, p) {
        var n = this;
        n.id = q;
        n.name = o;
        n.size = p;
        n.loaded = 0;
        n.percent = 0;
        n.status = 0
    };
    g.Runtime = function() {
        this.getFeatures = function() {
        };
        this.init = function(n, o) {
        }
    };
    g.QueueProgress = function() {
        var n = this;
        n.size = 0;
        n.loaded = 0;
        n.uploaded = 0;
        n.failed = 0;
        n.queued = 0;
        n.percent = 0;
        n.bytesPerSec = 0;
        n.reset = function() {
            n.size = n.loaded = n.uploaded = n.failed = n.queued = n.percent = n.bytesPerSec = 0
        }
    };
    g.runtimes = {};
    window.plupload = g
})();;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.html4.js
(function(d,a,b,c){function e(f){return a.getElementById(f)}b.runtimes.Html4=b.addRuntime("html4",{getFeatures:function(){return{multipart:true,triggerDialog:(b.ua.gecko&&d.FormData||b.ua.webkit)}},init:function(f,g){f.bind("Init",function(p){var j=a.body,n,h="javascript",k,x,q,z=[],r=/MSIE/.test(navigator.userAgent),t=[],m=p.settings.filters,o,l,s,w;no_type_restriction:for(o=0;o<m.length;o++){l=m[o].extensions.split(/,/);for(w=0;w<l.length;w++){if(l[w]==="*"){t=[];break no_type_restriction}s=b.mimeTypes[l[w]];if(s&&b.inArray(s,t)===-1){t.push(s)}}}t=t.join(",");function v(){var B,y,i,A;q=b.guid();z.push(q);B=a.createElement("form");B.setAttribute("id","form_"+q);B.setAttribute("method","post");B.setAttribute("enctype","multipart/form-data");B.setAttribute("encoding","multipart/form-data");B.setAttribute("target",p.id+"_iframe");B.style.position="absolute";y=a.createElement("input");y.setAttribute("id","input_"+q);y.setAttribute("type","file");y.setAttribute("accept",t);y.setAttribute("size",1);A=e(p.settings.browse_button);if(p.features.triggerDialog&&A){b.addEvent(e(p.settings.browse_button),"click",function(C){if(!y.disabled){y.click()}C.preventDefault()},p.id)}b.extend(y.style,{width:"100%",height:"100%",opacity:0,fontSize:"99px",cursor:"pointer"});b.extend(B.style,{overflow:"hidden"});i=p.settings.shim_bgcolor;if(i){B.style.background=i}if(r){b.extend(y.style,{filter:"alpha(opacity=0)"})}b.addEvent(y,"change",function(F){var D=F.target,C,E=[],G;if(D.value){e("form_"+q).style.top=-1048575+"px";C=D.value.replace(/\\/g,"/");C=C.substring(C.length,C.lastIndexOf("/")+1);E.push(new b.File(q,C));if(!p.features.triggerDialog){b.removeAllEvents(B,p.id)}else{b.removeEvent(A,"click",p.id)}b.removeEvent(y,"change",p.id);v();if(E.length){f.trigger("FilesAdded",E)}}},p.id);B.appendChild(y);j.appendChild(B);p.refresh()}function u(){var i=a.createElement("div");i.innerHTML='<iframe id="'+p.id+'_iframe" name="'+p.id+'_iframe" src="'+h+':&quot;&quot;" style="display:none"></iframe>';n=i.firstChild;j.appendChild(n);b.addEvent(n,"load",function(C){var D=C.target,B,y;if(!k){return}try{B=D.contentWindow.document||D.contentDocument||d.frames[D.id].document}catch(A){p.trigger("Error",{code:b.SECURITY_ERROR,message:b.translate("Security error."),file:k});return}y=B.documentElement.innerText||B.documentElement.textContent;if(y){k.status=b.DONE;k.loaded=1025;k.percent=100;p.trigger("UploadProgress",k);p.trigger("FileUploaded",k,{response:y})}},p.id)}if(p.settings.container){j=e(p.settings.container);if(b.getStyle(j,"position")==="static"){j.style.position="relative"}}p.bind("UploadFile",function(i,A){var B,y;if(A.status==b.DONE||A.status==b.FAILED||i.state==b.STOPPED){return}B=e("form_"+A.id);y=e("input_"+A.id);y.setAttribute("name",i.settings.file_data_name);B.setAttribute("action",i.settings.url);b.each(b.extend({name:A.target_name||A.name},i.settings.multipart_params),function(E,C){var D=a.createElement("input");b.extend(D,{type:"hidden",name:C,value:E});B.insertBefore(D,B.firstChild)});k=A;e("form_"+q).style.top=-1048575+"px";B.submit()});p.bind("FileUploaded",function(i){i.refresh()});p.bind("StateChanged",function(i){if(i.state==b.STARTED){u()}else{if(i.state==b.STOPPED){d.setTimeout(function(){b.removeEvent(n,"load",i.id);if(n.parentNode){n.parentNode.removeChild(n)}},0)}}b.each(i.files,function(A,y){if(A.status===b.DONE||A.status===b.FAILED){var B=e("form_"+A.id);if(B){B.parentNode.removeChild(B)}}})});p.bind("Refresh",function(y){var F,A,B,C,i,G,H,E,D;F=e(y.settings.browse_button);if(F){i=b.getPos(F,e(y.settings.container));G=b.getSize(F);H=e("form_"+q);E=e("input_"+q);b.extend(H.style,{top:i.y+"px",left:i.x+"px",width:G.w+"px",height:G.h+"px"});if(y.features.triggerDialog){if(b.getStyle(F,"position")==="static"){b.extend(F.style,{position:"relative"})}D=parseInt(F.style.zIndex,10);if(isNaN(D)){D=0}b.extend(F.style,{zIndex:D});b.extend(H.style,{zIndex:D-1})}B=y.settings.browse_button_hover;C=y.settings.browse_button_active;A=y.features.triggerDialog?F:H;if(B){b.addEvent(A,"mouseover",function(){b.addClass(F,B)},y.id);b.addEvent(A,"mouseout",function(){b.removeClass(F,B)},y.id)}if(C){b.addEvent(A,"mousedown",function(){b.addClass(F,C)},y.id);b.addEvent(a.body,"mouseup",function(){b.removeClass(F,C)},y.id)}}});f.bind("FilesRemoved",function(y,B){var A,C;for(A=0;A<B.length;A++){C=e("form_"+B[A].id);if(C){C.parentNode.removeChild(C)}}});f.bind("DisableBrowse",function(i,A){var y=a.getElementById("input_"+q);if(y){y.disabled=A}});f.bind("Destroy",function(i){var y,A,B,C={inputContainer:"form_"+q,inputFile:"input_"+q,browseButton:i.settings.browse_button};for(y in C){A=e(C[y]);if(A){b.removeAllEvents(A,i.id)}}b.removeAllEvents(a.body,i.id);b.each(z,function(E,D){B=e("form_"+E);if(B){B.parentNode.removeChild(B)}})});v()});g({success:true})}})})(window,document,plupload);;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.html4.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.html5.js
(function(k,m,l,g){var d={},j;function c(s){var r=s.naturalWidth,u=s.naturalHeight;if(r*u>1024*1024){var t=m.createElement("canvas");t.width=t.height=1;var q=t.getContext("2d");q.drawImage(s,-r+1,0);return q.getImageData(0,0,1,1).data[3]===0}else{return false}}function f(u,r,z){var q=m.createElement("canvas");q.width=1;q.height=z;var A=q.getContext("2d");A.drawImage(u,0,0);var t=A.getImageData(0,0,1,z).data;var x=0;var v=z;var y=z;while(y>x){var s=t[(y-1)*4+3];if(s===0){v=y}else{x=y}y=(v+x)>>1}var w=(y/z);return(w===0)?1:w}function o(K,s,t){var v=K.naturalWidth,z=K.naturalHeight;var E=t.width,B=t.height;var F=s.getContext("2d");F.save();var r=c(K);if(r){v/=2;z/=2}var I=1024;var q=m.createElement("canvas");q.width=q.height=I;var u=q.getContext("2d");var G=f(K,v,z);var A=0;while(A<z){var J=A+I>z?z-A:I;var C=0;while(C<v){var D=C+I>v?v-C:I;u.clearRect(0,0,I,I);u.drawImage(K,-C,-A);var x=(C*E/v)<<0;var y=Math.ceil(D*E/v);var w=(A*B/z/G)<<0;var H=Math.ceil(J*B/z/G);F.drawImage(q,0,0,D,J,x,w,y,H);C+=I}A+=I}F.restore();q=u=null}function p(r,s){var q;if("FileReader" in k){q=new FileReader();q.readAsDataURL(r);q.onload=function(){s(q.result)}}else{return s(r.getAsDataURL())}}function n(r,s){var q;if("FileReader" in k){q=new FileReader();q.readAsBinaryString(r);q.onload=function(){s(q.result)}}else{return s(r.getAsBinary())}}function e(u,s,q,y){var t,r,x,v,w=this;p(d[u.id],function(z){t=m.createElement("canvas");t.style.display="none";m.body.appendChild(t);x=new Image();x.onerror=x.onabort=function(){y({success:false})};x.onload=function(){var F,A,C,B,E;if(!s.width){s.width=x.width}if(!s.height){s.height=x.height}v=Math.min(s.width/x.width,s.height/x.height);if(v<1){F=Math.round(x.width*v);A=Math.round(x.height*v)}else{if(s.quality&&q==="image/jpeg"){F=x.width;A=x.height}else{y({success:false});return}}t.width=F;t.height=A;o(x,t,{width:F,height:A});if(q==="image/jpeg"){B=new h(atob(z.substring(z.indexOf("base64,")+7)));if(B.headers&&B.headers.length){E=new a();if(E.init(B.get("exif")[0])){E.setExif("PixelXDimension",F);E.setExif("PixelYDimension",A);B.set("exif",E.getBinary());if(w.hasEventListener("ExifData")){w.trigger("ExifData",u,E.EXIF())}if(w.hasEventListener("GpsData")){w.trigger("GpsData",u,E.GPS())}}}}if(s.quality&&q==="image/jpeg"){try{z=t.toDataURL(q,s.quality/100)}catch(D){z=t.toDataURL(q)}}else{z=t.toDataURL(q)}z=z.substring(z.indexOf("base64,")+7);z=atob(z);if(B&&B.headers&&B.headers.length){z=B.restore(z);B.purge()}t.parentNode.removeChild(t);y({success:true,data:z})};x.src=z})}l.runtimes.Html5=l.addRuntime("html5",{getFeatures:function(){var v,r,u,t,s,q;r=u=s=q=false;if(k.XMLHttpRequest){v=new XMLHttpRequest();u=!!v.upload;r=!!(v.sendAsBinary||v.upload)}if(r){t=!!(v.sendAsBinary||(k.Uint8Array&&k.ArrayBuffer));s=!!(File&&(File.prototype.getAsDataURL||k.FileReader)&&t);q=!!(File&&(File.prototype.mozSlice||File.prototype.webkitSlice||File.prototype.slice))}j=l.ua.safari&&l.ua.windows;return{html5:r,dragdrop:(function(){var w=m.createElement("div");return("draggable" in w)||("ondragstart" in w&&"ondrop" in w)}()),jpgresize:s,pngresize:s,multipart:s||!!k.FileReader||!!k.FormData,canSendBinary:t,cantSendBlobInFormData:!!(l.ua.gecko&&k.FormData&&k.FileReader&&!FileReader.prototype.readAsArrayBuffer)||l.ua.android,progress:u,chunks:q,multi_selection:!(l.ua.safari&&l.ua.windows),triggerDialog:(l.ua.gecko&&k.FormData||l.ua.webkit)}},init:function(s,u){var q,t;function r(z){var x,w,y=[],A,v={};for(w=0;w<z.length;w++){x=z[w];if(v[x.name]&&l.ua.safari&&l.ua.windows){continue}v[x.name]=true;A=l.guid();d[A]=x;y.push(new l.File(A,x.fileName||x.name,x.fileSize||x.size))}if(y.length){s.trigger("FilesAdded",y)}}q=this.getFeatures();if(!q.html5){u({success:false});return}s.bind("Init",function(A){var J,I,F=[],z,G,w=A.settings.filters,x,E,v=m.body,H;J=m.createElement("div");J.id=A.id+"_html5_container";l.extend(J.style,{position:"absolute",background:s.settings.shim_bgcolor||"transparent",width:"100px",height:"100px",overflow:"hidden",zIndex:99999,opacity:s.settings.shim_bgcolor?"":0});J.className="plupload html5";if(s.settings.container){v=m.getElementById(s.settings.container);if(l.getStyle(v,"position")==="static"){v.style.position="relative"}}v.appendChild(J);no_type_restriction:for(z=0;z<w.length;z++){x=w[z].extensions.split(/,/);for(G=0;G<x.length;G++){if(x[G]==="*"){F=[];break no_type_restriction}E=l.mimeTypes[x[G]];if(E&&l.inArray(E,F)===-1){F.push(E)}}}J.innerHTML='<input id="'+s.id+'_html5"  style="font-size:999px" type="file" accept="'+F.join(",")+'" '+(s.settings.multi_selection&&s.features.multi_selection?'multiple="multiple"':"")+" />";J.scrollTop=100;H=m.getElementById(s.id+"_html5");if(A.features.triggerDialog){l.extend(H.style,{position:"absolute",width:"100%",height:"100%"})}else{l.extend(H.style,{cssFloat:"right",styleFloat:"right"})}H.onchange=function(){r(this.files);this.value=""};I=m.getElementById(A.settings.browse_button);if(I){var C=A.settings.browse_button_hover,D=A.settings.browse_button_active,B=A.features.triggerDialog?I:J;if(C){l.addEvent(B,"mouseover",function(){l.addClass(I,C)},A.id);l.addEvent(B,"mouseout",function(){l.removeClass(I,C)},A.id)}if(D){l.addEvent(B,"mousedown",function(){l.addClass(I,D)},A.id);l.addEvent(m.body,"mouseup",function(){l.removeClass(I,D)},A.id)}if(A.features.triggerDialog){l.addEvent(I,"click",function(K){var y=m.getElementById(A.id+"_html5");if(y&&!y.disabled){y.click()}K.preventDefault()},A.id)}}});s.bind("PostInit",function(){var v=m.getElementById(s.settings.drop_element);if(v){if(j){l.addEvent(v,"dragenter",function(z){var y,w,x;y=m.getElementById(s.id+"_drop");if(!y){y=m.createElement("input");y.setAttribute("type","file");y.setAttribute("id",s.id+"_drop");y.setAttribute("multiple","multiple");l.addEvent(y,"change",function(){r(this.files);l.removeEvent(y,"change",s.id);y.parentNode.removeChild(y)},s.id);l.addEvent(y,"dragover",function(A){A.stopPropagation()},s.id);v.appendChild(y)}w=l.getPos(v,m.getElementById(s.settings.container));x=l.getSize(v);if(l.getStyle(v,"position")==="static"){l.extend(v.style,{position:"relative"})}l.extend(y.style,{position:"absolute",display:"block",top:0,left:0,width:x.w+"px",height:x.h+"px",opacity:0})},s.id);return}l.addEvent(v,"dragover",function(w){w.preventDefault()},s.id);l.addEvent(v,"drop",function(x){var w=x.dataTransfer;if(w&&w.files){r(w.files)}x.preventDefault()},s.id)}});s.bind("Refresh",function(v){var w,x,y,A,z;w=m.getElementById(s.settings.browse_button);if(w){x=l.getPos(w,m.getElementById(v.settings.container));y=l.getSize(w);A=m.getElementById(s.id+"_html5_container");l.extend(A.style,{top:x.y+"px",left:x.x+"px",width:y.w+"px",height:y.h+"px"});if(s.features.triggerDialog){if(l.getStyle(w,"position")==="static"){l.extend(w.style,{position:"relative"})}z=parseInt(l.getStyle(w,"zIndex"),10);if(isNaN(z)){z=0}l.extend(w.style,{zIndex:z});l.extend(A.style,{zIndex:z-1})}}});s.bind("DisableBrowse",function(v,x){var w=m.getElementById(v.id+"_html5");if(w){w.disabled=x}});s.bind("CancelUpload",function(){if(t&&t.abort){t.abort()}});s.bind("UploadFile",function(v,x){var y=v.settings,B,w;function A(D,G,C){var E;if(File.prototype.slice){try{D.slice();return D.slice(G,C)}catch(F){return D.slice(G,C-G)}}else{if(E=File.prototype.webkitSlice||File.prototype.mozSlice){return E.call(D,G,C)}else{return null}}}function z(C){var F=0,E=0;function D(){var L,P,N,O,K,M,H,G=v.settings.url;function J(S){if(t.sendAsBinary){t.sendAsBinary(S)}else{if(v.features.canSendBinary){var Q=new Uint8Array(S.length);for(var R=0;R<S.length;R++){Q[R]=(S.charCodeAt(R)&255)}t.send(Q.buffer)}}}function I(R){var V=0,W="----pluploadboundary"+l.guid(),T,S="--",U="\r\n",Q="";t=new XMLHttpRequest;if(t.upload){t.upload.onprogress=function(X){x.loaded=Math.min(x.size,E+X.loaded-V);v.trigger("UploadProgress",x)}}t.onreadystatechange=function(){var X,Z;if(t.readyState==4&&v.state!==l.STOPPED){try{X=t.status}catch(Y){X=0}if(X>=400){v.trigger("Error",{code:l.HTTP_ERROR,message:l.translate("HTTP Error."),file:x,status:X})}else{if(N){Z={chunk:F,chunks:N,response:t.responseText,status:X};v.trigger("ChunkUploaded",x,Z);E+=M;if(Z.cancelled){x.status=l.FAILED;return}x.loaded=Math.min(x.size,(F+1)*K)}else{x.loaded=x.size}v.trigger("UploadProgress",x);R=L=T=Q=null;if(!N||++F>=N){x.status=l.DONE;v.trigger("FileUploaded",x,{response:t.responseText,status:X})}else{D()}}}};if(v.settings.multipart&&q.multipart){O.name=x.target_name||x.name;t.open("post",G,true);l.each(v.settings.headers,function(Y,X){t.setRequestHeader(X,Y)});if(typeof(R)!=="string"&&!!k.FormData){T=new FormData();l.each(l.extend(O,v.settings.multipart_params),function(Y,X){T.append(X,Y)});T.append(v.settings.file_data_name,R);t.send(T);return}if(typeof(R)==="string"){t.setRequestHeader("Content-Type","multipart/form-data; boundary="+W);l.each(l.extend(O,v.settings.multipart_params),function(Y,X){Q+=S+W+U+'Content-Disposition: form-data; name="'+X+'"'+U+U;Q+=unescape(encodeURIComponent(Y))+U});H=l.mimeTypes[x.name.replace(/^.+\.([^.]+)/,"$1").toLowerCase()]||"application/octet-stream";Q+=S+W+U+'Content-Disposition: form-data; name="'+v.settings.file_data_name+'"; filename="'+unescape(encodeURIComponent(x.name))+'"'+U+"Content-Type: "+H+U+U+R+U+S+W+S+U;V=Q.length-R.length;R=Q;J(R);return}}G=l.buildUrl(v.settings.url,l.extend(O,v.settings.multipart_params));t.open("post",G,true);t.setRequestHeader("Content-Type","application/octet-stream");l.each(v.settings.headers,function(Y,X){t.setRequestHeader(X,Y)});if(typeof(R)==="string"){J(R)}else{t.send(R)}}if(x.status==l.DONE||x.status==l.FAILED||v.state==l.STOPPED){return}O={name:x.target_name||x.name};if(y.chunk_size&&x.size>y.chunk_size&&(q.chunks||typeof(C)=="string")){K=y.chunk_size;N=Math.ceil(x.size/K);M=Math.min(K,x.size-(F*K));if(typeof(C)=="string"){L=C.substring(F*K,F*K+M)}else{L=A(C,F*K,F*K+M)}O.chunk=F;O.chunks=N}else{M=x.size;L=C}if(v.settings.multipart&&q.multipart&&typeof(L)!=="string"&&k.FileReader&&q.cantSendBlobInFormData&&q.chunks&&v.settings.chunk_size){(function(){var Q=new FileReader();Q.onload=function(){I(Q.result);Q=null};Q.readAsBinaryString(L)}())}else{I(L)}}D()}B=d[x.id];if(q.jpgresize&&v.settings.resize&&/\.(png|jpg|jpeg)$/i.test(x.name)){e.call(v,x,v.settings.resize,/\.png$/i.test(x.name)?"image/png":"image/jpeg",function(C){if(C.success){x.size=C.data.length;z(C.data)}else{if(q.chunks){z(B)}else{n(B,z)}}})}else{if(!q.chunks&&q.jpgresize){n(B,z)}else{z(B)}}});s.bind("Destroy",function(v){var x,y,w=m.body,z={inputContainer:v.id+"_html5_container",inputFile:v.id+"_html5",browseButton:v.settings.browse_button,dropElm:v.settings.drop_element};for(x in z){y=m.getElementById(z[x]);if(y){l.removeAllEvents(y,v.id)}}l.removeAllEvents(m.body,v.id);if(v.settings.container){w=m.getElementById(v.settings.container)}w.removeChild(m.getElementById(z.inputContainer))});u({success:true})}});function b(){var t=false,r;function u(w,y){var v=t?0:-8*(y-1),z=0,x;for(x=0;x<y;x++){z|=(r.charCodeAt(w+x)<<Math.abs(v+x*8))}return z}function q(x,v,w){var w=arguments.length===3?w:r.length-v-1;r=r.substr(0,v)+x+r.substr(w+v)}function s(w,x,z){var A="",v=t?0:-8*(z-1),y;for(y=0;y<z;y++){A+=String.fromCharCode((x>>Math.abs(v+y*8))&255)}q(A,w,z)}return{II:function(v){if(v===g){return t}else{t=v}},init:function(v){t=false;r=v},SEGMENT:function(v,x,w){switch(arguments.length){case 1:return r.substr(v,r.length-v-1);case 2:return r.substr(v,x);case 3:q(w,v,x);break;default:return r}},BYTE:function(v){return u(v,1)},SHORT:function(v){return u(v,2)},LONG:function(v,w){if(w===g){return u(v,4)}else{s(v,w,4)}},SLONG:function(v){var w=u(v,4);return(w>2147483647?w-4294967296:w)},STRING:function(v,w){var x="";for(w+=v;v<w;v++){x+=String.fromCharCode(u(v,1))}return x}}}function h(v){var x={65505:{app:"EXIF",name:"APP1",signature:"Exif\0"},65506:{app:"ICC",name:"APP2",signature:"ICC_PROFILE\0"},65517:{app:"IPTC",name:"APP13",signature:"Photoshop 3.0\0"}},w=[],u,q,s=g,t=0,r;u=new b();u.init(v);if(u.SHORT(0)!==65496){return}q=2;r=Math.min(1048576,v.length);while(q<=r){s=u.SHORT(q);if(s>=65488&&s<=65495){q+=2;continue}if(s===65498||s===65497){break}t=u.SHORT(q+2)+2;if(x[s]&&u.STRING(q+4,x[s].signature.length)===x[s].signature){w.push({hex:s,app:x[s].app.toUpperCase(),name:x[s].name.toUpperCase(),start:q,length:t,segment:u.SEGMENT(q,t)})}q+=t}u.init(null);return{headers:w,restore:function(B){u.init(B);var z=new h(B);if(!z.headers){return false}for(var A=z.headers.length;A>0;A--){var C=z.headers[A-1];u.SEGMENT(C.start,C.length,"")}z.purge();q=u.SHORT(2)==65504?4+u.SHORT(4):2;for(var A=0,y=w.length;A<y;A++){u.SEGMENT(q,0,w[A].segment);q+=w[A].length}return u.SEGMENT()},get:function(A){var B=[];for(var z=0,y=w.length;z<y;z++){if(w[z].app===A.toUpperCase()){B.push(w[z].segment)}}return B},set:function(B,A){var C=[];if(typeof(A)==="string"){C.push(A)}else{C=A}for(var z=ii=0,y=w.length;z<y;z++){if(w[z].app===B.toUpperCase()){w[z].segment=C[ii];w[z].length=C[ii].length;ii++}if(ii>=C.length){break}}},purge:function(){w=[];u.init(null)}}}function a(){var t,q,r={},w;t=new b();q={tiff:{274:"Orientation",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer"},exif:{36864:"ExifVersion",40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",36867:"DateTimeOriginal",33434:"ExposureTime",33437:"FNumber",34855:"ISOSpeedRatings",37377:"ShutterSpeedValue",37378:"ApertureValue",37383:"MeteringMode",37384:"LightSource",37385:"Flash",41986:"ExposureMode",41987:"WhiteBalance",41990:"SceneCaptureType",41988:"DigitalZoomRatio",41992:"Contrast",41993:"Saturation",41994:"Sharpness"},gps:{0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude"}};w={ColorSpace:{1:"sRGB",0:"Uncalibrated"},MeteringMode:{0:"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{1:"Daylight",2:"Fliorescent",3:"Tungsten",4:"Flash",9:"Fine weather",10:"Cloudy weather",11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 -5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{0:"Flash did not fire.",1:"Flash fired.",5:"Strobe return light not detected.",7:"Strobe return light detected.",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected",15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode",77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},ExposureMode:{0:"Auto exposure",1:"Manual exposure",2:"Auto bracket"},WhiteBalance:{0:"Auto white balance",1:"Manual white balance"},SceneCaptureType:{0:"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},Contrast:{0:"Normal",1:"Soft",2:"Hard"},Saturation:{0:"Normal",1:"Low saturation",2:"High saturation"},Sharpness:{0:"Normal",1:"Soft",2:"Hard"},GPSLatitudeRef:{N:"North latitude",S:"South latitude"},GPSLongitudeRef:{E:"East longitude",W:"West longitude"}};function s(x,F){var z=t.SHORT(x),C,I,J,E,D,y,A,G,H=[],B={};for(C=0;C<z;C++){A=y=x+12*C+2;J=F[t.SHORT(A)];if(J===g){continue}E=t.SHORT(A+=2);D=t.LONG(A+=2);A+=4;H=[];switch(E){case 1:case 7:if(D>4){A=t.LONG(A)+r.tiffHeader}for(I=0;I<D;I++){H[I]=t.BYTE(A+I)}break;case 2:if(D>4){A=t.LONG(A)+r.tiffHeader}B[J]=t.STRING(A,D-1);continue;case 3:if(D>2){A=t.LONG(A)+r.tiffHeader}for(I=0;I<D;I++){H[I]=t.SHORT(A+I*2)}break;case 4:if(D>1){A=t.LONG(A)+r.tiffHeader}for(I=0;I<D;I++){H[I]=t.LONG(A+I*4)}break;case 5:A=t.LONG(A)+r.tiffHeader;for(I=0;I<D;I++){H[I]=t.LONG(A+I*4)/t.LONG(A+I*4+4)}break;case 9:A=t.LONG(A)+r.tiffHeader;for(I=0;I<D;I++){H[I]=t.SLONG(A+I*4)}break;case 10:A=t.LONG(A)+r.tiffHeader;for(I=0;I<D;I++){H[I]=t.SLONG(A+I*4)/t.SLONG(A+I*4+4)}break;default:continue}G=(D==1?H[0]:H);if(w.hasOwnProperty(J)&&typeof G!="object"){B[J]=w[J][G]}else{B[J]=G}}return B}function v(){var y=g,x=r.tiffHeader;t.II(t.SHORT(x)==18761);if(t.SHORT(x+=2)!==42){return false}r.IFD0=r.tiffHeader+t.LONG(x+=2);y=s(r.IFD0,q.tiff);r.exifIFD=("ExifIFDPointer" in y?r.tiffHeader+y.ExifIFDPointer:g);r.gpsIFD=("GPSInfoIFDPointer" in y?r.tiffHeader+y.GPSInfoIFDPointer:g);return true}function u(z,x,C){var E,B,A,D=0;if(typeof(x)==="string"){var y=q[z.toLowerCase()];for(hex in y){if(y[hex]===x){x=hex;break}}}E=r[z.toLowerCase()+"IFD"];B=t.SHORT(E);for(i=0;i<B;i++){A=E+12*i+2;if(t.SHORT(A)==x){D=A+8;break}}if(!D){return false}t.LONG(D,C);return true}return{init:function(x){r={tiffHeader:10};if(x===g||!x.length){return false}t.init(x);if(t.SHORT(0)===65505&&t.STRING(4,5).toUpperCase()==="EXIF\0"){return v()}return false},EXIF:function(){var y;y=s(r.exifIFD,q.exif);if(y.ExifVersion&&l.typeOf(y.ExifVersion)==="array"){for(var z=0,x="";z<y.ExifVersion.length;z++){x+=String.fromCharCode(y.ExifVersion[z])}y.ExifVersion=x}return y},GPS:function(){var x;x=s(r.gpsIFD,q.gps);if(x.GPSVersionID){x.GPSVersionID=x.GPSVersionID.join(".")}return x},setExif:function(x,y){if(x!=="PixelXDimension"&&x!=="PixelYDimension"){return false}return u("exif",x,y)},getBinary:function(){return t.SEGMENT()}}}})(window,document,plupload);;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/plupload.html5.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/jquery.ui.plupload.js
(function(f,a,c,g,e){var h={};function b(i){return c.translate(i)||i}function d(i){i.html('<div class="plupload_wrapper"><div class="ui-widget-content plupload_container"><div class="plupload"><div class="ui-state-default ui-widget-header plupload_header"><div class="plupload_header_content"><div class="plupload_header_title">'+b("Select files")+'</div><div class="plupload_header_text">'+b("Add files to the upload queue and click the start button.")+'</div></div></div><div class="plupload_content"><table class="plupload_filelist"><tr class="ui-widget-header plupload_filelist_header"><td class="plupload_cell plupload_file_name">'+b("Filename")+'</td><td class="plupload_cell plupload_file_status">'+b("Status")+'</td><td class="plupload_cell plupload_file_size">'+b("Size")+'</td><td class="plupload_cell plupload_file_action">&nbsp;</td></tr></table><div class="plupload_scroll"><table class="plupload_filelist_content"></table></div><table class="plupload_filelist"><tr class="ui-widget-header ui-widget-content plupload_filelist_footer"><td class="plupload_cell plupload_file_name"><div class="plupload_buttons"><!-- Visible --><a class="plupload_button plupload_add">'+b("Add Files")+'</a>&nbsp;<a class="plupload_button plupload_start">'+b("Start Upload")+'</a>&nbsp;<a class="plupload_button plupload_stop plupload_hidden">'+b("Stop Upload")+'</a>&nbsp;</div><div class="plupload_started plupload_hidden"><!-- Hidden --><div class="plupload_progress plupload_right"><div class="plupload_progress_container"></div></div><div class="plupload_cell plupload_upload_status"></div><div class="plupload_clearer">&nbsp;</div></div></td><td class="plupload_file_status"><span class="plupload_total_status">0%</span></td><td class="plupload_file_size"><span class="plupload_total_file_size">0 kb</span></td><td class="plupload_file_action"></td></tr></table></div></div></div><input class="plupload_count" value="0" type="hidden"></div>')}g.widget("ui.plupload",{contents_bak:"",runtime:null,options:{browse_button_hover:"ui-state-hover",browse_button_active:"ui-state-active",dragdrop:true,multiple_queues:true,buttons:{browse:true,start:true,stop:true},autostart:false,sortable:false,rename:false,max_file_count:0},FILE_COUNT_ERROR:-9001,_create:function(){var i=this,k,j;k=this.element.attr("id");if(!k){k=c.guid();this.element.attr("id",k)}this.id=k;this.contents_bak=this.element.html();d(this.element);this.container=g(".plupload_container",this.element).attr("id",k+"_container");this.filelist=g(".plupload_filelist_content",this.container).attr({id:k+"_filelist",unselectable:"on"});this.browse_button=g(".plupload_add",this.container).attr("id",k+"_browse");this.start_button=g(".plupload_start",this.container).attr("id",k+"_start");this.stop_button=g(".plupload_stop",this.container).attr("id",k+"_stop");if(g.ui.button){this.browse_button.button({icons:{primary:"ui-icon-circle-plus"}});this.start_button.button({icons:{primary:"ui-icon-circle-arrow-e"},disabled:true});this.stop_button.button({icons:{primary:"ui-icon-circle-close"}})}this.progressbar=g(".plupload_progress_container",this.container);if(g.ui.progressbar){this.progressbar.progressbar()}this.counter=g(".plupload_count",this.element).attr({id:k+"_count",name:k+"_count"});j=this.uploader=h[k]=new c.Uploader(g.extend({container:k,browse_button:k+"_browse"},this.options));j.bind("Error",function(l,m){if(m.code===c.INIT_ERROR){i.destroy()}});j.bind("Init",function(l,m){if(!i.options.buttons.browse){i.browse_button.button("disable").hide();l.disableBrowse(true)}if(!i.options.buttons.start){i.start_button.button("disable").hide()}if(!i.options.buttons.stop){i.stop_button.button("disable").hide()}if(!i.options.unique_names&&i.options.rename){i._enableRenaming()}if(j.features.dragdrop&&i.options.dragdrop){i._enableDragAndDrop()}i.container.attr("title",b("Using runtime: ")+(i.runtime=m.runtime));i.start_button.click(function(n){if(!g(this).button("option","disabled")){i.start()}n.preventDefault()});i.stop_button.click(function(n){i.stop();n.preventDefault()})});if(i.options.max_file_count){j.bind("FilesAdded",function(l,n){var o=[],m=n.length;var p=l.files.length+m-i.options.max_file_count;if(p>0){o=n.splice(m-p,p);l.trigger("Error",{code:i.FILE_COUNT_ERROR,message:b("File count error."),file:o})}})}j.init();j.bind("FilesAdded",function(l,m){i._trigger("selected",null,{up:l,files:m});if(i.options.autostart){setTimeout(function(){i.start()},10)}});j.bind("FilesRemoved",function(l,m){i._trigger("removed",null,{up:l,files:m})});j.bind("QueueChanged",function(){i._updateFileList()});j.bind("StateChanged",function(){i._handleState()});j.bind("UploadFile",function(l,m){i._handleFileStatus(m)});j.bind("FileUploaded",function(l,m){i._handleFileStatus(m);i._trigger("uploaded",null,{up:l,file:m})});j.bind("UploadProgress",function(l,m){g("#"+m.id).find(".plupload_file_status").html(m.percent+"%").end().find(".plupload_file_size").html(c.formatSize(m.size));i._handleFileStatus(m);i._updateTotalProgress();i._trigger("progress",null,{up:l,file:m})});j.bind("UploadComplete",function(l,m){i._trigger("complete",null,{up:l,files:m})});j.bind("Error",function(l,p){var n=p.file,o,m;if(n){o="<strong>"+p.message+"</strong>";m=p.details;if(m){o+=" <br /><i>"+p.details+"</i>"}else{switch(p.code){case c.FILE_EXTENSION_ERROR:m=b("File: %s").replace("%s",n.name);break;case c.FILE_SIZE_ERROR:m=b("File: %f, size: %s, max file size: %m").replace(/%([fsm])/g,function(r,q){switch(q){case"f":return n.name;case"s":return n.size;case"m":return c.parseSize(i.options.max_file_size)}});break;case i.FILE_COUNT_ERROR:m=b("Upload element accepts only %d file(s) at a time. Extra files were stripped.").replace("%d",i.options.max_file_count);break;case c.IMAGE_FORMAT_ERROR:m=c.translate("Image format either wrong or not supported.");break;case c.IMAGE_MEMORY_ERROR:m=c.translate("Runtime ran out of available memory.");break;case c.IMAGE_DIMENSIONS_ERROR:m=c.translate("Resoultion out of boundaries! <b>%s</b> runtime supports images only up to %wx%hpx.").replace(/%([swh])/g,function(r,q){switch(q){case"s":return l.runtime;case"w":return l.features.maxWidth;case"h":return l.features.maxHeight}});break;case c.HTTP_ERROR:m=b("Upload URL might be wrong or doesn't exist");break}o+=" <br /><i>"+m+"</i>"}i.notify("error",o);i._trigger("error",null,{up:l,file:n,error:o})}})},_setOption:function(j,k){var i=this;if(j=="buttons"&&typeof(k)=="object"){k=g.extend(i.options.buttons,k);if(!k.browse){i.browse_button.button("disable").hide();up.disableBrowse(true)}else{i.browse_button.button("enable").show();up.disableBrowse(false)}if(!k.start){i.start_button.button("disable").hide()}else{i.start_button.button("enable").show()}if(!k.stop){i.stop_button.button("disable").hide()}else{i.start_button.button("enable").show()}}i.uploader.settings[j]=k},start:function(){this.uploader.start();this._trigger("start",null)},stop:function(){this.uploader.stop();this._trigger("stop",null)},getFile:function(j){var i;if(typeof j==="number"){i=this.uploader.files[j]}else{i=this.uploader.getFile(j)}return i},removeFile:function(j){var i=this.getFile(j);if(i){this.uploader.removeFile(i)}},clearQueue:function(){this.uploader.splice()},getUploader:function(){return this.uploader},refresh:function(){this.uploader.refresh()},_handleState:function(){var j=this,i=this.uploader;if(i.state===c.STARTED){g(j.start_button).button("disable");g([]).add(j.stop_button).add(".plupload_started").removeClass("plupload_hidden");g(".plupload_upload_status",j.element).html(b("Uploaded %d/%d files").replace("%d/%d",i.total.uploaded+"/"+i.files.length));g(".plupload_header_content",j.element).addClass("plupload_header_content_bw")}else{g([]).add(j.stop_button).add(".plupload_started").addClass("plupload_hidden");if(j.options.multiple_queues){g(j.start_button).button("enable");g(".plupload_header_content",j.element).removeClass("plupload_header_content_bw")}j._updateFileList()}},_handleFileStatus:function(l){var n,j;if(!g("#"+l.id).length){return}switch(l.status){case c.DONE:n="plupload_done";j="ui-icon ui-icon-circle-check";break;case c.FAILED:n="ui-state-error plupload_failed";j="ui-icon ui-icon-alert";break;case c.QUEUED:n="plupload_delete";j="ui-icon ui-icon-circle-minus";break;case c.UPLOADING:n="ui-state-highlight plupload_uploading";j="ui-icon ui-icon-circle-arrow-w";var i=g(".plupload_scroll",this.container),m=i.scrollTop(),o=i.height(),k=g("#"+l.id).position().top+g("#"+l.id).height();if(o<k){i.scrollTop(m+k-o)}break}n+=" ui-state-default plupload_file";g("#"+l.id).attr("class",n).find(".ui-icon").attr("class",j)},_updateTotalProgress:function(){var i=this.uploader;this.progressbar.progressbar("value",i.total.percent);this.element.find(".plupload_total_status").html(i.total.percent+"%").end().find(".plupload_total_file_size").html(c.formatSize(i.total.size)).end().find(".plupload_upload_status").html(b("Uploaded %d/%d files").replace("%d/%d",i.total.uploaded+"/"+i.files.length))},_updateFileList:function(){var k=this,j=this.uploader,m=this.filelist,l=0,o,n=this.id+"_",i;if(g.ui.sortable&&this.options.sortable){g("tbody.ui-sortable",m).sortable("destroy")}m.empty();g.each(j.files,function(q,p){i="";o=n+l;if(p.status===c.DONE){if(p.target_name){i+='<input type="hidden" name="'+o+'_tmpname" value="'+c.xmlEncode(p.target_name)+'" />'}i+='<input type="hidden" name="'+o+'_name" value="'+c.xmlEncode(p.name)+'" />';i+='<input type="hidden" name="'+o+'_status" value="'+(p.status===c.DONE?"done":"failed")+'" />';l++;k.counter.val(l)}m.append('<tr class="ui-state-default plupload_file" id="'+p.id+'"><td class="plupload_cell plupload_file_name"><span>'+p.name+'</span></td><td class="plupload_cell plupload_file_status">'+p.percent+'%</td><td class="plupload_cell plupload_file_size">'+c.formatSize(p.size)+'</td><td class="plupload_cell plupload_file_action"><div class="ui-icon"></div>'+i+"</td></tr>");k._handleFileStatus(p);g("#"+p.id+".plupload_delete .ui-icon, #"+p.id+".plupload_done .ui-icon").click(function(r){g("#"+p.id).remove();j.removeFile(p);r.preventDefault()});k._trigger("updatelist",null,m)});if(j.total.queued===0){g(".ui-button-text",k.browse_button).html(b("Add Files"))}else{g(".ui-button-text",k.browse_button).html(b("%d files queued").replace("%d",j.total.queued))}if(j.files.length===(j.total.uploaded+j.total.failed)){k.start_button.button("disable")}else{k.start_button.button("enable")}m[0].scrollTop=m[0].scrollHeight;k._updateTotalProgress();if(!j.files.length&&j.features.dragdrop&&j.settings.dragdrop){g("#"+o+"_filelist").append('<tr><td class="plupload_droptext">'+b("Drag files here.")+"</td></tr>")}else{if(k.options.sortable&&g.ui.sortable){k._enableSortingList()}}},_enableRenaming:function(){var i=this;this.filelist.on("click",".plupload_delete .plupload_file_name span",function(o){var m=g(o.target),k,n,j,l="";k=i.uploader.getFile(m.parents("tr")[0].id);j=k.name;n=/^(.+)(\.[^.]+)$/.exec(j);if(n){j=n[1];l=n[2]}m.hide().after('<input class="plupload_file_rename" type="text" />');m.next().val(j).focus().blur(function(){m.show().next().remove()}).keydown(function(q){var p=g(this);if(g.inArray(q.keyCode,[13,27])!==-1){q.preventDefault();if(q.keyCode===13){k.name=p.val()+l;m.html(k.name)}p.blur()}})})},_enableDragAndDrop:function(){this.filelist.append('<tr><td class="plupload_droptext">'+b("Drag files here.")+"</td></tr>");this.filelist.parent().attr("id",this.id+"_dropbox");this.uploader.settings.drop_element=this.options.drop_element=this.id+"_dropbox"},_enableSortingList:function(){var j,i=this;if(g("tbody tr",this.filelist).length<2){return}g("tbody",this.filelist).sortable({containment:"parent",items:".plupload_delete",helper:function(l,k){return k.clone(true).find("td:not(.plupload_file_name)").remove().end().css("width","100%")},stop:function(p,o){var l,n,k,m=[];g.each(g(this).sortable("toArray"),function(q,r){m[m.length]=i.uploader.getFile(r)});m.unshift(m.length);m.unshift(0);Array.prototype.splice.apply(i.uploader.files,m)}})},notify:function(j,k){var i=g('<div class="plupload_message"><span class="plupload_message_close ui-icon ui-icon-circle-close" title="'+b("Close")+'"></span><p><span class="ui-icon"></span>'+k+"</p></div>");i.addClass("ui-state-"+(j==="error"?"error":"highlight")).find("p .ui-icon").addClass("ui-icon-"+(j==="error"?"alert":"info")).end().find(".plupload_message_close").click(function(){i.remove()}).end();g(".plupload_header_content",this.container).append(i)},destroy:function(){g(".plupload_button",this.element).unbind();if(g.ui.button){g(".plupload_add, .plupload_start, .plupload_stop",this.container).button("destroy")}if(g.ui.progressbar){this.progressbar.progressbar("destroy")}if(g.ui.sortable&&this.options.sortable){g("tbody",this.filelist).sortable("destroy")}this.uploader.destroy();this.element.empty().html(this.contents_bak);this.contents_bak="";g.Widget.prototype.destroy.apply(this)}})}(window,document,plupload,jQuery));;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/jquery.ui.plupload.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/diff.js
/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

  // Defaults.
  // Redefine these in your program to override the defaults.

  // Number of seconds to map a diff before giving up (0 for infinity).
  this.Diff_Timeout = 1.0;
  // Cost of an empty edit operation in terms of edit characters.
  this.Diff_EditCost = 4;
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  this.Match_Threshold = 0.5;
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  this.Match_Distance = 1000;
  // When deleting a large block of text (over ~64 characters), how close do
  // the contents have to be to match the expected contents. (0.0 = perfection,
  // 1.0 = very loose).  Note that Match_Threshold controls how closely the
  // end points of a delete need to match.
  this.Patch_DeleteThreshold = 0.5;
  // Chunk size for context length.
  this.Patch_Margin = 4;

  // The number of bits in an int.
  this.Match_MaxBits = 32;
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;

/** @typedef {{0: number, 1: string}} */
diff_match_patch.Diff;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean=} opt_checklines Optional speedup flag. If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff.
 * @param {number} opt_deadline Optional time when the diff should be complete
 *     by.  Used internally for recursive calls.  Users should set DiffTimeout
 *     instead.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines,
    opt_deadline) {
  // Set a deadline by which time the diff must be complete.
  if (typeof opt_deadline == 'undefined') {
    if (this.Diff_Timeout <= 0) {
      opt_deadline = Number.MAX_VALUE;
    } else {
      opt_deadline = (new Date).getTime() + this.Diff_Timeout * 1000;
    }
  }
  var deadline = opt_deadline;

  // Check for null inputs.
  if (text1 == null || text2 == null) {
    throw new Error('Null input. (diff_main)');
  }

  // Check for equality (speedup).
  if (text1 == text2) {
    if (text1) {
      return [[DIFF_EQUAL, text1]];
    }
    return [];
  }

  if (typeof opt_checklines == 'undefined') {
    opt_checklines = true;
  }
  var checklines = opt_checklines;

  // Trim off common prefix (speedup).
  var commonlength = this.diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup).
  commonlength = this.diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block.
  var diffs = this.diff_compute_(text1, text2, checklines, deadline);

  // Restore the prefix and suffix.
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  this.diff_cleanupMerge(diffs);
  return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute_ = function(text1, text2, checklines,
    deadline) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup).
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup).
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i != -1) {
    // Shorter text is inside the longer text (speedup).
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }

  if (shorttext.length == 1) {
    // Single character string.
    // After the previous speedup, the character can't be an equality.
    return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }

  // Check to see if the problem can be split in two.
  var hm = this.diff_halfMatch_(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = this.diff_main(text1_a, text2_a, checklines, deadline);
    var diffs_b = this.diff_main(text1_b, text2_b, checklines, deadline);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  if (checklines && text1.length > 100 && text2.length > 100) {
    return this.diff_lineMode_(text1, text2, deadline);
  }

  return this.diff_bisect_(text1, text2, deadline);
};


/**
 * Do a quick line-level diff on both strings, then rediff the parts for
 * greater accuracy.
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time when the diff should be complete by.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_lineMode_ = function(text1, text2, deadline) {
  // Scan the text on a line-by-line basis first.
  var a = this.diff_linesToChars_(text1, text2);
  text1 = a.chars1;
  text2 = a.chars2;
  var linearray = a.lineArray;

  var diffs = this.diff_main(text1, text2, false, deadline);

  // Convert the diff back to original text.
  this.diff_charsToLines_(diffs, linearray);
  // Eliminate freak matches (e.g. blank lines)
  this.diff_cleanupSemantic(diffs);

  // Rediff any replacement blocks, this time character-by-character.
  // Add a dummy entry at the end.
  diffs.push([DIFF_EQUAL, '']);
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete >= 1 && count_insert >= 1) {
          // Delete the offending records and add the merged ones.
          diffs.splice(pointer - count_delete - count_insert,
                       count_delete + count_insert);
          pointer = pointer - count_delete - count_insert;
          var a = this.diff_main(text_delete, text_insert, false, deadline);
          for (var j = a.length - 1; j >= 0; j--) {
            diffs.splice(pointer, 0, a[j]);
          }
          pointer = pointer + a.length;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
    pointer++;
  }
  diffs.pop();  // Remove the dummy entry at the end.

  return diffs;
};


/**
 * Find the 'middle snake' of a diff, split the problem in two
 * and return the recursively constructed diff.
 * See Myers 1986 paper: An O(ND) Difference Algorithm and Its Variations.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisect_ = function(text1, text2, deadline) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = Math.ceil((text1_length + text2_length) / 2);
  var v_offset = max_d;
  var v_length = 2 * max_d;
  var v1 = new Array(v_length);
  var v2 = new Array(v_length);
  // Setting all elements to -1 is faster in Chrome & Firefox than mixing
  // integers and undefined.
  for (var x = 0; x < v_length; x++) {
    v1[x] = -1;
    v2[x] = -1;
  }
  v1[v_offset + 1] = 0;
  v2[v_offset + 1] = 0;
  var delta = text1_length - text2_length;
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (delta % 2 != 0);
  // Offsets for start and end of k loop.
  // Prevents mapping of space beyond the grid.
  var k1start = 0;
  var k1end = 0;
  var k2start = 0;
  var k2end = 0;
  for (var d = 0; d < max_d; d++) {
    // Bail out if deadline is reached.
    if ((new Date()).getTime() > deadline) {
      break;
    }

    // Walk the front path one step.
    for (var k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
      var k1_offset = v_offset + k1;
      var x1;
      if (k1 == -d || (k1 != d && v1[k1_offset - 1] < v1[k1_offset + 1])) {
        x1 = v1[k1_offset + 1];
      } else {
        x1 = v1[k1_offset - 1] + 1;
      }
      var y1 = x1 - k1;
      while (x1 < text1_length && y1 < text2_length &&
             text1.charAt(x1) == text2.charAt(y1)) {
        x1++;
        y1++;
      }
      v1[k1_offset] = x1;
      if (x1 > text1_length) {
        // Ran off the right of the graph.
        k1end += 2;
      } else if (y1 > text2_length) {
        // Ran off the bottom of the graph.
        k1start += 2;
      } else if (front) {
        var k2_offset = v_offset + delta - k1;
        if (k2_offset >= 0 && k2_offset < v_length && v2[k2_offset] != -1) {
          // Mirror x2 onto top-left coordinate system.
          var x2 = text1_length - v2[k2_offset];
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }

    // Walk the reverse path one step.
    for (var k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
      var k2_offset = v_offset + k2;
      var x2;
      if (k2 == -d || (k2 != d && v2[k2_offset - 1] < v2[k2_offset + 1])) {
        x2 = v2[k2_offset + 1];
      } else {
        x2 = v2[k2_offset - 1] + 1;
      }
      var y2 = x2 - k2;
      while (x2 < text1_length && y2 < text2_length &&
             text1.charAt(text1_length - x2 - 1) ==
             text2.charAt(text2_length - y2 - 1)) {
        x2++;
        y2++;
      }
      v2[k2_offset] = x2;
      if (x2 > text1_length) {
        // Ran off the left of the graph.
        k2end += 2;
      } else if (y2 > text2_length) {
        // Ran off the top of the graph.
        k2start += 2;
      } else if (!front) {
        var k1_offset = v_offset + delta - k2;
        if (k1_offset >= 0 && k1_offset < v_length && v1[k1_offset] != -1) {
          var x1 = v1[k1_offset];
          var y1 = v_offset + x1 - k1_offset;
          // Mirror x2 onto top-left coordinate system.
          x2 = text1_length - x2;
          if (x1 >= x2) {
            // Overlap detected.
            return this.diff_bisectSplit_(text1, text2, x1, y1, deadline);
          }
        }
      }
    }
  }
  // Diff took too long and hit the deadline or
  // number of diffs equals number of characters, no commonality at all.
  return [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
};


/**
 * Given the location of the 'middle snake', split the diff in two parts
 * and recurse.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {number} x Index of split point in text1.
 * @param {number} y Index of split point in text2.
 * @param {number} deadline Time at which to bail if not yet complete.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_bisectSplit_ = function(text1, text2, x, y,
    deadline) {
  var text1a = text1.substring(0, x);
  var text2a = text2.substring(0, y);
  var text1b = text1.substring(x);
  var text2b = text2.substring(y);

  // Compute both diffs serially.
  var diffs = this.diff_main(text1a, text2a, false, deadline);
  var diffsb = this.diff_main(text1b, text2b, false, deadline);

  return diffs.concat(diffsb);
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {{chars1: string, chars2: string, lineArray: !Array.<string>}}
 *     An object containing the encoded text1, the encoded text2 and
 *     the array of unique strings.
 *     The zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars_ = function(text1, text2) {
  var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
  var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode.
   * @return {string} Encoded string.
   * @private
   */
  function diff_linesToCharsMunge_(text) {
    var chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    var lineStart = 0;
    var lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    var lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd == -1) {
        lineEnd = text.length - 1;
      }
      var line = text.substring(lineStart, lineEnd + 1);
      lineStart = lineEnd + 1;

      if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
          (lineHash[line] !== undefined)) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
    }
    return chars;
  }

  var chars1 = diff_linesToCharsMunge_(text1);
  var chars2 = diff_linesToCharsMunge_(text2);
  return {chars1: chars1, chars2: chars2, lineArray: lineArray};
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {!Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines_ = function(diffs, lineArray) {
  for (var x = 0; x < diffs.length; x++) {
    var chars = diffs[x][1];
    var text = [];
    for (var y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)];
    }
    diffs[x][1] = text.join('');
  }
};


/**
 * Determine the common prefix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charAt(0) != text2.charAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine the common suffix of two strings.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 ||
      text1.charAt(text1.length - 1) != text2.charAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine if the suffix of one string is the prefix of another.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of the first
 *     string and the start of the second string.
 * @private
 */
diff_match_patch.prototype.diff_commonOverlap_ = function(text1, text2) {
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  // Eliminate the null case.
  if (text1_length == 0 || text2_length == 0) {
    return 0;
  }
  // Truncate the longer string.
  if (text1_length > text2_length) {
    text1 = text1.substring(text1_length - text2_length);
  } else if (text1_length < text2_length) {
    text2 = text2.substring(0, text1_length);
  }
  var text_length = Math.min(text1_length, text2_length);
  // Quick check for the worst case.
  if (text1 == text2) {
    return text_length;
  }

  // Start by looking for a single character match
  // and increase length until no match is found.
  // Performance analysis: http://neil.fraser.name/news/2010/11/04/
  var best = 0;
  var length = 1;
  while (true) {
    var pattern = text1.substring(text_length - length);
    var found = text2.indexOf(pattern);
    if (found == -1) {
      return best;
    }
    length += found;
    if (found == 0 || text1.substring(text_length - length) ==
        text2.substring(0, length)) {
      best = length;
      length++;
    }
  }
};


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * This speedup can produce non-minimal diffs.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 * @private
 */
diff_match_patch.prototype.diff_halfMatch_ = function(text1, text2) {
  if (this.Diff_Timeout <= 0) {
    // Don't risk returning a non-optimal diff if we have unlimited time.
    return null;
  }
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 4 || shorttext.length * 2 < longtext.length) {
    return null;  // Pointless.
  }
  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext.
   * @return {Array.<string>} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI_(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
      var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) +
            shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length * 2 >= longtext.length) {
      return [best_longtext_a, best_longtext_b,
              best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI_(longtext, shorttext,
                             Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  /** @type {?string} */
  var lastequality = null;
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  var pointer = 0;  // Index of current position.
  // Number of characters that changed prior to the equality.
  var length_insertions1 = 0;
  var length_deletions1 = 0;
  // Number of characters that changed after the equality.
  var length_insertions2 = 0;
  var length_deletions2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      equalities[equalitiesLength++] = pointer;
      length_insertions1 = length_insertions2;
      length_deletions1 = length_deletions2;
      length_insertions2 = 0;
      length_deletions2 = 0;
      lastequality = diffs[pointer][1];
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_INSERT) {
        length_insertions2 += diffs[pointer][1].length;
      } else {
        length_deletions2 += diffs[pointer][1].length;
      }
      // Eliminate an equality that is smaller or equal to the edits on both
      // sides of it.
      if (lastequality && (lastequality.length <=
          Math.max(length_insertions1, length_deletions1)) &&
          (lastequality.length <= Math.max(length_insertions2,
                                           length_deletions2))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_insertions1 = 0;  // Reset the counters.
        length_deletions1 = 0;
        length_insertions2 = 0;
        length_deletions2 = 0;
        lastequality = null;
        changes = true;
      }
    }
    pointer++;
  }

  // Normalize the diff.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
  this.diff_cleanupSemanticLossless(diffs);

  // Find any overlaps between deletions and insertions.
  // e.g: <del>abcxxx</del><ins>xxxdef</ins>
  //   -> <del>abc</del>xxx<ins>def</ins>
  // e.g: <del>xxxabc</del><ins>defxxx</ins>
  //   -> <ins>def</ins>xxx<del>abc</del>
  // Only extract an overlap if it is as big as the edit ahead or behind it.
  pointer = 1;
  while (pointer < diffs.length) {
    if (diffs[pointer - 1][0] == DIFF_DELETE &&
        diffs[pointer][0] == DIFF_INSERT) {
      var deletion = diffs[pointer - 1][1];
      var insertion = diffs[pointer][1];
      var overlap_length1 = this.diff_commonOverlap_(deletion, insertion);
      var overlap_length2 = this.diff_commonOverlap_(insertion, deletion);
      if (overlap_length1 >= overlap_length2) {
        if (overlap_length1 >= deletion.length / 2 ||
            overlap_length1 >= insertion.length / 2) {
          // Overlap found.  Insert an equality and trim the surrounding edits.
          diffs.splice(pointer, 0,
              [DIFF_EQUAL, insertion.substring(0, overlap_length1)]);
          diffs[pointer - 1][1] =
              deletion.substring(0, deletion.length - overlap_length1);
          diffs[pointer + 1][1] = insertion.substring(overlap_length1);
          pointer++;
        }
      } else {
        if (overlap_length2 >= deletion.length / 2 ||
            overlap_length2 >= insertion.length / 2) {
          // Reverse overlap found.
          // Insert an equality and swap and trim the surrounding edits.
          diffs.splice(pointer, 0,
              [DIFF_EQUAL, deletion.substring(0, overlap_length2)]);
          diffs[pointer - 1][0] = DIFF_INSERT;
          diffs[pointer - 1][1] =
              insertion.substring(0, insertion.length - overlap_length2);
          diffs[pointer + 1][0] = DIFF_DELETE;
          diffs[pointer + 1][1] =
              deletion.substring(overlap_length2);
          pointer++;
        }
      }
      pointer++;
    }
    pointer++;
  }
};


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 6 (best) to 0 (worst).
   * Closure, but does not reference any external variables.
   * @param {string} one First string.
   * @param {string} two Second string.
   * @return {number} The score.
   * @private
   */
  function diff_cleanupSemanticScore_(one, two) {
    if (!one || !two) {
      // Edges are the best.
      return 6;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    var char1 = one.charAt(one.length - 1);
    var char2 = two.charAt(0);
    var nonAlphaNumeric1 = char1.match(diff_match_patch.nonAlphaNumericRegex_);
    var nonAlphaNumeric2 = char2.match(diff_match_patch.nonAlphaNumericRegex_);
    var whitespace1 = nonAlphaNumeric1 &&
        char1.match(diff_match_patch.whitespaceRegex_);
    var whitespace2 = nonAlphaNumeric2 &&
        char2.match(diff_match_patch.whitespaceRegex_);
    var lineBreak1 = whitespace1 &&
        char1.match(diff_match_patch.linebreakRegex_);
    var lineBreak2 = whitespace2 &&
        char2.match(diff_match_patch.linebreakRegex_);
    var blankLine1 = lineBreak1 &&
        one.match(diff_match_patch.blanklineEndRegex_);
    var blankLine2 = lineBreak2 &&
        two.match(diff_match_patch.blanklineStartRegex_);

    if (blankLine1 || blankLine2) {
      // Five points for blank lines.
      return 5;
    } else if (lineBreak1 || lineBreak2) {
      // Four points for line breaks.
      return 4;
    } else if (nonAlphaNumeric1 && !whitespace1 && whitespace2) {
      // Three points for end of sentences.
      return 3;
    } else if (whitespace1 || whitespace2) {
      // Two points for whitespace.
      return 2;
    } else if (nonAlphaNumeric1 || nonAlphaNumeric2) {
      // One point for non-alphanumeric.
      return 1;
    }
    return 0;
  }

  var pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      var equality1 = diffs[pointer - 1][1];
      var edit = diffs[pointer][1];
      var equality2 = diffs[pointer + 1][1];

      // First, shift the edit as far left as possible.
      var commonOffset = this.diff_commonSuffix(equality1, edit);
      if (commonOffset) {
        var commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
      var bestEquality1 = equality1;
      var bestEdit = edit;
      var bestEquality2 = equality2;
      var bestScore = diff_cleanupSemanticScore_(equality1, edit) +
          diff_cleanupSemanticScore_(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        var score = diff_cleanupSemanticScore_(equality1, edit) +
            diff_cleanupSemanticScore_(edit, equality2);
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] != bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
};

// Define some regex patterns for matching boundaries.
diff_match_patch.nonAlphaNumericRegex_ = /[^a-zA-Z0-9]/;
diff_match_patch.whitespaceRegex_ = /\s/;
diff_match_patch.linebreakRegex_ = /[\r\n]/;
diff_match_patch.blanklineEndRegex_ = /\n\r?\n$/;
diff_match_patch.blanklineStartRegex_ = /^\r?\n\r?\n/;

/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  /** @type {?string} */
  var lastequality = null;
  // Always equal to diffs[equalities[equalitiesLength - 1]][1]
  var pointer = 0;  // Index of current position.
  // Is there an insertion operation before the last equality.
  var pre_ins = false;
  // Is there a deletion operation before the last equality.
  var pre_del = false;
  // Is there an insertion operation after the last equality.
  var post_ins = false;
  // Is there a deletion operation after the last equality.
  var post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // Equality found.
      if (diffs[pointer][1].length < this.Diff_EditCost &&
          (post_ins || post_del)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastequality = diffs[pointer][1];
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0;
        lastequality = null;
      }
      post_ins = post_del = false;
    } else {  // An insertion or deletion.
      if (diffs[pointer][0] == DIFF_DELETE) {
        post_del = true;
      } else {
        post_ins = true;
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                           ((lastequality.length < this.Diff_EditCost / 2) &&
                            (pre_ins + pre_del + post_ins + post_del) == 3))) {
        // Duplicate record.
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;  // Throw away the equality we just deleted;
        lastequality = null;
        if (pre_ins && pre_del) {
          // No changes made which could affect previous entry, keep going.
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;  // Throw away the previous equality.
          pointer = equalitiesLength > 0 ?
              equalities[equalitiesLength - 1] : -1;
          post_ins = post_del = false;
        }
        changes = true;
      }
    }
    pointer++;
  }

  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete + count_insert > 1) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = this.diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
            commonlength = this.diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length -
                  commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length -
                  commonlength);
              text_delete = text_delete.substring(0, text_delete.length -
                  commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
  var chars1 = 0;
  var chars2 = 0;
  var last_chars1 = 0;
  var last_chars2 = 0;
  var x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {  // Overshot the location.
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  // Was the location was deleted?
  if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
    return last_chars2;
  }
  // Add the remaining character length.
  return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
  var html = [];
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
        .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
        break;
      case DIFF_DELETE:
        html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
        break;
      case DIFF_EQUAL:
        html[x] = '<span>' + text + '</span>';
        break;
    }
  }
  return html.join('');
};


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
  var levenshtein = 0;
  var insertions = 0;
  var deletions = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];
    var data = diffs[x][1];
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length;
        break;
      case DIFF_DELETE:
        deletions += data.length;
        break;
      case DIFF_EQUAL:
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        text[x] = '+' + encodeURI(diffs[x][1]);
        break;
      case DIFF_DELETE:
        text[x] = '-' + diffs[x][1].length;
        break;
      case DIFF_EQUAL:
        text[x] = '=' + diffs[x][1].length;
        break;
    }
  }
  return text.join('\t').replace(/%20/g, ' ');
};


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {!Array.<!diff_match_patch.Diff>} Array of diff tuples.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
  var diffs = [];
  var diffsLength = 0;  // Keeping our own length var is faster in JS.
  var pointer = 0;  // Cursor in text1
  var tokens = delta.split(/\t/g);
  for (var x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    var param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param);
        }
        break;
      case '-':
        // Fall through.
      case '=':
        var n = parseInt(param, 10);
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param);
        }
        var text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) == '=') {
          diffs[diffsLength++] = [DIFF_EQUAL, text];
        } else {
          diffs[diffsLength++] = [DIFF_DELETE, text];
        }
        break;
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
        if (tokens[x]) {
          throw new Error('Invalid diff operation in diff_fromDelta: ' +
                          tokens[x]);
        }
    }
  }
  if (pointer != text1.length) {
    throw new Error('Delta length (' + pointer +
        ') does not equal source text length (' + text1.length + ').');
  }
  return diffs;
};


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
  // Check for null inputs.
  if (text == null || pattern == null || loc == null) {
    throw new Error('Null input. (match_main)');
  }

  loc = Math.max(0, Math.min(loc, text.length));
  if (text == pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0;
  } else if (!text.length) {
    // Nothing to match.
    return -1;
  } else if (text.substring(loc, loc + pattern.length) == pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc;
  } else {
    // Do a fuzzy compare.
    return this.match_bitap_(text, pattern, loc);
  }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap_ = function(text, pattern, loc) {
  if (pattern.length > this.Match_MaxBits) {
    throw new Error('Pattern too long for this browser.');
  }

  // Initialise the alphabet.
  var s = this.match_alphabet_(pattern);

  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function match_bitapScore_(e, x) {
    var accuracy = e / pattern.length;
    var proximity = Math.abs(loc - x);
    if (!dmp.Match_Distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy;
    }
    return accuracy + (proximity / dmp.Match_Distance);
  }

  // Highest score beyond which we give up.
  var score_threshold = this.Match_Threshold;
  // Is there a nearby exact match? (speedup)
  var best_loc = text.indexOf(pattern, loc);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore_(0, best_loc), score_threshold);
    // What about in the other direction? (speedup)
    best_loc = text.lastIndexOf(pattern, loc + pattern.length);
    if (best_loc != -1) {
      score_threshold =
          Math.min(match_bitapScore_(0, best_loc), score_threshold);
    }
  }

  // Initialise the bit arrays.
  var matchmask = 1 << (pattern.length - 1);
  best_loc = -1;

  var bin_min, bin_mid;
  var bin_max = pattern.length + text.length;
  var last_rd;
  for (var d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (match_bitapScore_(d, loc + bin_mid) <= score_threshold) {
        bin_min = bin_mid;
      } else {
        bin_max = bin_mid;
      }
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    // Use the result from this iteration as the maximum for the next.
    bin_max = bin_mid;
    var start = Math.max(1, loc - bin_mid + 1);
    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

    var rd = Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (var j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      var charMatch = s[text.charAt(j - 1)];
      if (d === 0) {  // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
      } else {  // Subsequent passes: fuzzy match.
        rd[j] = (((rd[j + 1] << 1) | 1) & charMatch) |
                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        var score = match_bitapScore_(d, j - 1);
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= score_threshold) {
          // Told you so.
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            // Already passed loc, downhill from here on in.
            break;
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (match_bitapScore_(d + 1, loc) > score_threshold) {
      break;
    }
    last_rd = rd;
  }
  return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {!Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet_ = function(pattern) {
  var s = {};
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0;
  }
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
  }
  return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {!diff_match_patch.patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext_ = function(patch, text) {
  if (text.length == 0) {
    return;
  }
  var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  var padding = 0;

  // Look for the first and last matches of pattern in text.  If two different
  // matches are found, increase the pattern length.
  while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
         pattern.length < this.Match_MaxBits - this.Patch_Margin -
         this.Patch_Margin) {
    padding += this.Patch_Margin;
    pattern = text.substring(patch.start2 - padding,
                             patch.start2 + patch.length1 + padding);
  }
  // Add one chunk for good luck.
  padding += this.Patch_Margin;

  // Add the prefix.
  var prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix) {
    patch.diffs.unshift([DIFF_EQUAL, prefix]);
  }
  // Add the suffix.
  var suffix = text.substring(patch.start2 + patch.length1,
                              patch.start2 + patch.length1 + padding);
  if (suffix) {
    patch.diffs.push([DIFF_EQUAL, suffix]);
  }

  // Roll back the start points.
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|!Array.<!diff_match_patch.Diff>} a text1 (methods 1,3,4) or
 * Array of diff tuples for text1 to text2 (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_b text2 (methods 1,4) or
 * Array of diff tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|!Array.<!diff_match_patch.Diff>} opt_c Array of diff tuples
 * for text1 to text2 (method 4) or undefined (methods 1,2,3).
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
  var text1, diffs;
  if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'undefined') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    text1 = /** @type {string} */(a);
    diffs = this.diff_main(text1, /** @type {string} */(opt_b), true);
    if (diffs.length > 2) {
      this.diff_cleanupSemantic(diffs);
      this.diff_cleanupEfficiency(diffs);
    }
  } else if (a && typeof a == 'object' && typeof opt_b == 'undefined' &&
      typeof opt_c == 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(a);
    text1 = this.diff_text1(diffs);
  } else if (typeof a == 'string' && opt_b && typeof opt_b == 'object' &&
      typeof opt_c == 'undefined') {
    // Method 3: text1, diffs
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_b);
  } else if (typeof a == 'string' && typeof opt_b == 'string' &&
      opt_c && typeof opt_c == 'object') {
    // Method 4: text1, text2, diffs
    // text2 is not used.
    text1 = /** @type {string} */(a);
    diffs = /** @type {!Array.<!diff_match_patch.Diff>} */(opt_c);
  } else {
    throw new Error('Unknown call format to patch_make.');
  }

  if (diffs.length === 0) {
    return [];  // Get rid of the null case.
  }
  var patches = [];
  var patch = new diff_match_patch.patch_obj();
  var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
  var char_count1 = 0;  // Number of characters into the text1 string.
  var char_count2 = 0;  // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  var prepatch_text = text1;
  var postpatch_text = text1;
  for (var x = 0; x < diffs.length; x++) {
    var diff_type = diffs[x][0];
    var diff_text = diffs[x][1];

    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      // A new patch starts here.
      patch.start1 = char_count1;
      patch.start2 = char_count2;
    }

    switch (diff_type) {
      case DIFF_INSERT:
        patch.diffs[patchDiffLength++] = diffs[x];
        patch.length2 += diff_text.length;
        postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                         postpatch_text.substring(char_count2);
        break;
      case DIFF_DELETE:
        patch.length1 += diff_text.length;
        patch.diffs[patchDiffLength++] = diffs[x];
        postpatch_text = postpatch_text.substring(0, char_count2) +
                         postpatch_text.substring(char_count2 +
                             diff_text.length);
        break;
      case DIFF_EQUAL:
        if (diff_text.length <= 2 * this.Patch_Margin &&
            patchDiffLength && diffs.length != x + 1) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * this.Patch_Margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            this.patch_addContext_(patch, prepatch_text);
            patches.push(patch);
            patch = new diff_match_patch.patch_obj();
            patchDiffLength = 0;
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }

    // Update the current character count.
    if (diff_type !== DIFF_INSERT) {
      char_count1 += diff_text.length;
    }
    if (diff_type !== DIFF_DELETE) {
      char_count2 += diff_text.length;
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    this.patch_addContext_(patch, prepatch_text);
    patches.push(patch);
  }

  return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
  // Making deep copies is hard in JavaScript.
  var patchesCopy = [];
  for (var x = 0; x < patches.length; x++) {
    var patch = patches[x];
    var patchCopy = new diff_match_patch.patch_obj();
    patchCopy.diffs = [];
    for (var y = 0; y < patch.diffs.length; y++) {
      patchCopy.diffs[y] = patch.diffs[y].slice();
    }
    patchCopy.start1 = patch.start1;
    patchCopy.start2 = patch.start2;
    patchCopy.length1 = patch.length1;
    patchCopy.length2 = patch.length2;
    patchesCopy[x] = patchCopy;
  }
  return patchesCopy;
};


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @param {string} text Old text.
 * @return {!Array.<string|!Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
  if (patches.length == 0) {
    return [text, []];
  }

  // Deep copy the patches so that no changes are made to originals.
  patches = this.patch_deepCopy(patches);

  var nullPadding = this.patch_addPadding(patches);
  text = nullPadding + text + nullPadding;

  this.patch_splitMax(patches);
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  var delta = 0;
  var results = [];
  for (var x = 0; x < patches.length; x++) {
    var expected_loc = patches[x].start2 + delta;
    var text1 = this.diff_text1(patches[x].diffs);
    var start_loc;
    var end_loc = -1;
    if (text1.length > this.Match_MaxBits) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                                  expected_loc);
      if (start_loc != -1) {
        end_loc = this.match_main(text,
            text1.substring(text1.length - this.Match_MaxBits),
            expected_loc + text1.length - this.Match_MaxBits);
        if (end_loc == -1 || start_loc >= end_loc) {
          // Can't find valid trailing context.  Drop this patch.
          start_loc = -1;
        }
      }
    } else {
      start_loc = this.match_main(text, text1, expected_loc);
    }
    if (start_loc == -1) {
      // No match found.  :(
      results[x] = false;
      // Subtract the delta for this failed patch from subsequent patches.
      delta -= patches[x].length2 - patches[x].length1;
    } else {
      // Found a match.  :)
      results[x] = true;
      delta = start_loc - expected_loc;
      var text2;
      if (end_loc == -1) {
        text2 = text.substring(start_loc, start_loc + text1.length);
      } else {
        text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
      }
      if (text1 == text2) {
        // Perfect match, just shove the replacement text in.
        text = text.substring(0, start_loc) +
               this.diff_text2(patches[x].diffs) +
               text.substring(start_loc + text1.length);
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        var diffs = this.diff_main(text1, text2, false);
        if (text1.length > this.Match_MaxBits &&
            this.diff_levenshtein(diffs) / text1.length >
            this.Patch_DeleteThreshold) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false;
        } else {
          this.diff_cleanupSemanticLossless(diffs);
          var index1 = 0;
          var index2;
          for (var y = 0; y < patches[x].diffs.length; y++) {
            var mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL) {
              index2 = this.diff_xIndex(diffs, index1);
            }
            if (mod[0] === DIFF_INSERT) {  // Insertion
              text = text.substring(0, start_loc + index2) + mod[1] +
                     text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {  // Deletion
              text = text.substring(0, start_loc + index2) +
                     text.substring(start_loc + this.diff_xIndex(diffs,
                         index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE) {
              index1 += mod[1].length;
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
  var paddingLength = this.Patch_Margin;
  var nullPadding = '';
  for (var x = 1; x <= paddingLength; x++) {
    nullPadding += String.fromCharCode(x);
  }

  // Bump all the patches forward.
  for (var x = 0; x < patches.length; x++) {
    patches[x].start1 += paddingLength;
    patches[x].start2 += paddingLength;
  }

  // Add some padding on start of first diff.
  var patch = patches[0];
  var diffs = patch.diffs;
  if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding]);
    patch.start1 -= paddingLength;  // Should be 0.
    patch.start2 -= paddingLength;  // Should be 0.
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[0][1].length) {
    // Grow first equality.
    var extraLength = paddingLength - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding]);
    patch.length1 += paddingLength;
    patch.length2 += paddingLength;
  } else if (paddingLength > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    var extraLength = paddingLength - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * Intended to be called only from within patch_apply.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
  var patch_size = this.Match_MaxBits;
  for (var x = 0; x < patches.length; x++) {
    if (patches[x].length1 <= patch_size) {
      continue;
    }
    var bigpatch = patches[x];
    // Remove the big old patch.
    patches.splice(x--, 1);
    var start1 = bigpatch.start1;
    var start2 = bigpatch.start2;
    var precontext = '';
    while (bigpatch.diffs.length !== 0) {
      // Create one of several smaller patches.
      var patch = new diff_match_patch.patch_obj();
      var empty = true;
      patch.start1 = start1 - precontext.length;
      patch.start2 = start2 - precontext.length;
      if (precontext !== '') {
        patch.length1 = patch.length2 = precontext.length;
        patch.diffs.push([DIFF_EQUAL, precontext]);
      }
      while (bigpatch.diffs.length !== 0 &&
             patch.length1 < patch_size - this.Patch_Margin) {
        var diff_type = bigpatch.diffs[0][0];
        var diff_text = bigpatch.diffs[0][1];
        if (diff_type === DIFF_INSERT) {
          // Insertions are harmless.
          patch.length2 += diff_text.length;
          start2 += diff_text.length;
          patch.diffs.push(bigpatch.diffs.shift());
          empty = false;
        } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                   patch.diffs[0][0] == DIFF_EQUAL &&
                   diff_text.length > 2 * patch_size) {
          // This is a large deletion.  Let it pass in one chunk.
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          empty = false;
          patch.diffs.push([diff_type, diff_text]);
          bigpatch.diffs.shift();
        } else {
          // Deletion or equality.  Only take as much as we can stomach.
          diff_text = diff_text.substring(0,
              patch_size - patch.length1 - this.Patch_Margin);
          patch.length1 += diff_text.length;
          start1 += diff_text.length;
          if (diff_type === DIFF_EQUAL) {
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
          } else {
            empty = false;
          }
          patch.diffs.push([diff_type, diff_text]);
          if (diff_text == bigpatch.diffs[0][1]) {
            bigpatch.diffs.shift();
          } else {
            bigpatch.diffs[0][1] =
                bigpatch.diffs[0][1].substring(diff_text.length);
          }
        }
      }
      // Compute the head context for the next patch.
      precontext = this.diff_text2(patch.diffs);
      precontext =
          precontext.substring(precontext.length - this.Patch_Margin);
      // Append the end context for this patch.
      var postcontext = this.diff_text1(bigpatch.diffs)
                            .substring(0, this.Patch_Margin);
      if (postcontext !== '') {
        patch.length1 += postcontext.length;
        patch.length2 += postcontext.length;
        if (patch.diffs.length !== 0 &&
            patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
          patch.diffs[patch.diffs.length - 1][1] += postcontext;
        } else {
          patch.diffs.push([DIFF_EQUAL, postcontext]);
        }
      }
      if (!empty) {
        patches.splice(++x, 0, patch);
      }
    }
  }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {!Array.<!diff_match_patch.patch_obj>} patches Array of Patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
  var text = [];
  for (var x = 0; x < patches.length; x++) {
    text[x] = patches[x];
  }
  return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of Patch objects.
 * @param {string} textline Text representation of patches.
 * @return {!Array.<!diff_match_patch.patch_obj>} Array of Patch objects.
 * @throws {!Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
  var patches = [];
  if (!textline) {
    return patches;
  }
  var text = textline.split('\n');
  var textPointer = 0;
  var patchHeader = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/;
  while (textPointer < text.length) {
    var m = text[textPointer].match(patchHeader);
    if (!m) {
      throw new Error('Invalid patch string: ' + text[textPointer]);
    }
    var patch = new diff_match_patch.patch_obj();
    patches.push(patch);
    patch.start1 = parseInt(m[1], 10);
    if (m[2] === '') {
      patch.start1--;
      patch.length1 = 1;
    } else if (m[2] == '0') {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = parseInt(m[2], 10);
    }

    patch.start2 = parseInt(m[3], 10);
    if (m[4] === '') {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] == '0') {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = parseInt(m[4], 10);
    }
    textPointer++;

    while (textPointer < text.length) {
      var sign = text[textPointer].charAt(0);
      try {
        var line = decodeURI(text[textPointer].substring(1));
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line);
      }
      if (sign == '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line]);
      } else if (sign == '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line]);
      } else if (sign == ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line]);
      } else if (sign == '@') {
        // Start of next patch.
        break;
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
      }
      textPointer++;
    }
  }
  return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
diff_match_patch.patch_obj = function() {
  /** @type {!Array.<!diff_match_patch.Diff>} */
  this.diffs = [];
  /** @type {?number} */
  this.start1 = null;
  /** @type {?number} */
  this.start2 = null;
  /** @type {number} */
  this.length1 = 0;
  /** @type {number} */
  this.length2 = 0;
};


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
diff_match_patch.patch_obj.prototype.toString = function() {
  var coords1, coords2;
  if (this.length1 === 0) {
    coords1 = this.start1 + ',0';
  } else if (this.length1 == 1) {
    coords1 = this.start1 + 1;
  } else {
    coords1 = (this.start1 + 1) + ',' + this.length1;
  }
  if (this.length2 === 0) {
    coords2 = this.start2 + ',0';
  } else if (this.length2 == 1) {
    coords2 = this.start2 + 1;
  } else {
    coords2 = (this.start2 + 1) + ',' + this.length2;
  }
  var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
  var op;
  // Escape the body of the patch with %xx notation.
  for (var x = 0; x < this.diffs.length; x++) {
    switch (this.diffs[x][0]) {
      case DIFF_INSERT:
        op = '+';
        break;
      case DIFF_DELETE:
        op = '-';
        break;
      case DIFF_EQUAL:
        op = ' ';
        break;
    }
    text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
  }
  return text.join('').replace(/%20/g, ' ');
};


// Export these global variables so that they survive Google's JS compiler.
// In a browser, 'this' will be 'window'.
// Users of node.js should 'require' the uncompressed version since Google's
// JS compiler may break the following exports for non-browser environments.
this['diff_match_patch'] = diff_match_patch;
this['DIFF_DELETE'] = DIFF_DELETE;
this['DIFF_INSERT'] = DIFF_INSERT;
this['DIFF_EQUAL'] = DIFF_EQUAL;
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/diff.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/jquery-pnotify.js
/*
 * jQuery Pines Notify (pnotify) Plugin 1.2.2
 *
 * http://pinesframework.org/pnotify/
 * Copyright (c) 2009-2012 Hunter Perrin
 *
 * Triple license under the GPL, LGPL, and MPL:
 *	  http://www.gnu.org/licenses/gpl.html
 *	  http://www.gnu.org/licenses/lgpl.html
 *	  http://www.mozilla.org/MPL/MPL-1.1.html
 */

(function($) {
	var history_handle_top,
		timer,
		body,
		jwindow = $(window),
		styling = {
			jqueryui: {
				container: "ui-widget ui-widget-content ui-corner-all",
				notice: "ui-state-highlight",
				// (The actual jQUI notice icon looks terrible.)
				notice_icon: "ui-icon ui-icon-info",
				info: "",
				info_icon: "ui-icon ui-icon-info",
				success: "ui-state-default",
				success_icon: "ui-icon ui-icon-circle-check",
				error: "ui-state-error",
				error_icon: "ui-icon ui-icon-alert",
				closer: "ui-icon ui-icon-close",
				pin_up: "ui-icon ui-icon-pin-w",
				pin_down: "ui-icon ui-icon-pin-s",
				hi_menu: "ui-state-default ui-corner-bottom",
				hi_btn: "ui-state-default ui-corner-all",
				hi_btnhov: "ui-state-hover",
				hi_hnd: "ui-icon ui-icon-grip-dotted-horizontal"
			},
			bootstrap: {
				container: "alert",
				notice: "",
				notice_icon: "icon-exclamation-sign",
				info: "alert-info",
				info_icon: "icon-info-sign",
				success: "alert-success",
				success_icon: "icon-ok-sign",
				error: "alert-error",
				error_icon: "icon-warning-sign",
				closer: "icon-remove",
				pin_up: "icon-pause",
				pin_down: "icon-play",
				hi_menu: "well",
				hi_btn: "btn",
				hi_btnhov: "",
				hi_hnd: "icon-chevron-down"
			}
		};
	// Set global variables.
	var do_when_ready = function(){
		body = $("body");
		jwindow = $(window);
		// Reposition the notices when the window resizes.
		jwindow.bind('resize', function(){
			if (timer)
				clearTimeout(timer);
			timer = setTimeout($.pnotify_position_all, 10);
		});
	};
	if (document.body)
		do_when_ready();
	else
		$(do_when_ready);
	$.extend({
		pnotify_remove_all: function () {
			var notices_data = jwindow.data("pnotify");
			/* POA: Added null-check */
			if (notices_data && notices_data.length) {
				$.each(notices_data, function(){
					if (this.pnotify_remove)
						this.pnotify_remove();
				});
			}
		},
		pnotify_position_all: function () {
			// This timer is used for queueing this function so it doesn't run
			// repeatedly.
			if (timer)
				clearTimeout(timer);
			timer = null;
			// Get all the notices.
			var notices_data = jwindow.data("pnotify");
			if (!notices_data || !notices_data.length)
				return;
			// Reset the next position data.
			$.each(notices_data, function(){
				var s = this.opts.stack;
				if (!s) return;
				s.nextpos1 = s.firstpos1;
				s.nextpos2 = s.firstpos2;
				s.addpos2 = 0;
				s.animation = true;
			});
			$.each(notices_data, function(){
				this.pnotify_position();
			});
		},
		pnotify: function(options) {
			// Stores what is currently being animated (in or out).
			var animating;

			// Build main options.
			var opts;
			if (typeof options != "object") {
				opts = $.extend({}, $.pnotify.defaults);
				opts.text = options;
			} else {
				opts = $.extend({}, $.pnotify.defaults, options);
			}
			// Translate old pnotify_ style options.
			for (var i in opts) {
				if (typeof i == "string" && i.match(/^pnotify_/))
					opts[i.replace(/^pnotify_/, "")] = opts[i];
			}

			if (opts.before_init) {
				if (opts.before_init(opts) === false)
					return null;
			}

			// This keeps track of the last element the mouse was over, so
			// mouseleave, mouseenter, etc can be called.
			var nonblock_last_elem;
			// This is used to pass events through the notice if it is non-blocking.
			var nonblock_pass = function(e, e_name){
				pnotify.css("display", "none");
				var element_below = document.elementFromPoint(e.clientX, e.clientY);
				pnotify.css("display", "block");
				var jelement_below = $(element_below);
				var cursor_style = jelement_below.css("cursor");
				pnotify.css("cursor", cursor_style != "auto" ? cursor_style : "default");
				// If the element changed, call mouseenter, mouseleave, etc.
				if (!nonblock_last_elem || nonblock_last_elem.get(0) != element_below) {
					if (nonblock_last_elem) {
						dom_event.call(nonblock_last_elem.get(0), "mouseleave", e.originalEvent);
						dom_event.call(nonblock_last_elem.get(0), "mouseout", e.originalEvent);
					}
					dom_event.call(element_below, "mouseenter", e.originalEvent);
					dom_event.call(element_below, "mouseover", e.originalEvent);
				}
				dom_event.call(element_below, e_name, e.originalEvent);
				// Remember the latest element the mouse was over.
				nonblock_last_elem = jelement_below;
			};

			// Get our styling object.
			var styles = styling[opts.styling];

			// Create our widget.
			// Stop animation, reset the removal timer, and show the close
			// button when the user mouses over.
			var pnotify = $("<div />", {
				"class": "ui-pnotify "+opts.addclass,
				"css": {"display": "none"},
				"mouseenter": function(e){
					if (opts.nonblock) e.stopPropagation();
					if (opts.mouse_reset && animating == "out") {
						// If it's animating out, animate back in really quickly.
						pnotify.stop(true);
						animating = "in";
						pnotify.css("height", "auto").animate({"width": opts.width, "opacity": opts.nonblock ? opts.nonblock_opacity : opts.opacity}, "fast");
					}
					if (opts.nonblock) {
						// If it's non-blocking, animate to the other opacity.
						pnotify.stop().animate({"opacity": opts.nonblock_opacity}, "fast");
					}
					// Stop the close timer.
					if (opts.hide && opts.mouse_reset) pnotify.pnotify_cancel_remove();
					// Show the buttons.
					if (opts.sticker && !opts.nonblock) pnotify.sticker.trigger("pnotify_icon").css("visibility", "visible");
					if (opts.closer && !opts.nonblock) pnotify.closer.css("visibility", "visible");
				},
				"mouseleave": function(e){
					if (opts.nonblock) e.stopPropagation();
					nonblock_last_elem = null;
					pnotify.css("cursor", "auto");
					// Animate back to the normal opacity.
					if (opts.nonblock && animating != "out")
						pnotify.stop().animate({"opacity": opts.opacity}, "fast");
					// Start the close timer.
					if (opts.hide && opts.mouse_reset) pnotify.pnotify_queue_remove();
					// Hide the buttons.
					if (opts.sticker_hover)
						pnotify.sticker.css("visibility", "hidden");
					if (opts.closer_hover)
						pnotify.closer.css("visibility", "hidden");
					$.pnotify_position_all();
				},
				"mouseover": function(e){
					if (opts.nonblock) e.stopPropagation();
				},
				"mouseout": function(e){
					if (opts.nonblock) e.stopPropagation();
				},
				"mousemove": function(e){
					if (opts.nonblock) {
						e.stopPropagation();
						nonblock_pass(e, "onmousemove");
					}
				},
				"mousedown": function(e){
					if (opts.nonblock) {
						e.stopPropagation();
						e.preventDefault();
						nonblock_pass(e, "onmousedown");
					}
				},
				"mouseup": function(e){
					if (opts.nonblock) {
						e.stopPropagation();
						e.preventDefault();
						nonblock_pass(e, "onmouseup");
					}
				},
				"click": function(e){
					if (opts.nonblock) {
						e.stopPropagation();
						nonblock_pass(e, "onclick");
					}
				},
				"dblclick": function(e){
					if (opts.nonblock) {
						e.stopPropagation();
						nonblock_pass(e, "ondblclick");
					}
				}
			});
			pnotify.opts = opts;
			// Create a container for the notice contents.
                        var stateClass;
                        if (opts.state) {
                            stateClass = 'ui-state-' + opts.state;
                        } else if (styles[opts.type]) {
                            stateClass = styles[opts.type];
                        } else {
                            stateClass = styles.notice;
                        }
			pnotify.container = $("<div />", {
                            "class": styles.container + " ui-pnotify-container " + stateClass
                        }).appendTo(pnotify);
			if (opts.cornerclass != "")
				pnotify.container.removeClass("ui-corner-all").addClass(opts.cornerclass);
			// Create a drop shadow.
			if (opts.shadow)
				pnotify.container.addClass("ui-pnotify-shadow");

			// The current version of Pines Notify.
			pnotify.pnotify_version = "1.2.2";

			// This function is for updating the notice.
			pnotify.pnotify = function(options) {
				// Update the notice.
				var old_opts = opts;
				if (typeof options == "string")
					opts.text = options;
				else
					opts = $.extend({}, opts, options);
				// Translate old pnotify_ style options.
				for (var i in opts) {
					if (typeof i == "string" && i.match(/^pnotify_/))
						opts[i.replace(/^pnotify_/, "")] = opts[i];
				}
				pnotify.opts = opts;
				// Update the corner class.
				if (opts.cornerclass != old_opts.cornerclass)
					pnotify.container.removeClass("ui-corner-all").addClass(opts.cornerclass);
				// Update the shadow.
				if (opts.shadow != old_opts.shadow) {
					if (opts.shadow)
						pnotify.container.addClass("ui-pnotify-shadow");
					else
						pnotify.container.removeClass("ui-pnotify-shadow");
				}
				// Update the additional classes.
				if (opts.addclass === false)
					pnotify.removeClass(old_opts.addclass);
				else if (opts.addclass !== old_opts.addclass)
					pnotify.removeClass(old_opts.addclass).addClass(opts.addclass);
				// Update the title.
				if (opts.title === false)
					pnotify.title_container.slideUp("fast");
				else if (opts.title !== old_opts.title) {
					if (opts.title_escape)
						pnotify.title_container.text(opts.title).slideDown(200);
					else
						pnotify.title_container.html(opts.title).slideDown(200);
				}
				// Update the text.
				if (opts.text === false) {
					pnotify.text_container.slideUp("fast");
				} else if (opts.text !== old_opts.text) {
					if (opts.text_escape)
						pnotify.text_container.text(opts.text).slideDown(200);
					else
						pnotify.text_container.html(opts.insert_brs ? String(opts.text).replace(/\n/g, "<br />") : opts.text).slideDown(200);
				}
				// Update values for history menu access.
				pnotify.pnotify_history = opts.history;
				pnotify.pnotify_hide = opts.hide;
				// Change the notice type.
				if (opts.type != old_opts.type)
					pnotify.container.removeClass(styles.error+" "+styles.notice+" "+styles.success+" "+styles.info).addClass(opts.type == "error" ? styles.error : (opts.type == "info" ? styles.info : (opts.type == "success" ? styles.success : styles.notice)));
				if (opts.icon !== old_opts.icon || (opts.icon === true && opts.type != old_opts.type)) {
					// Remove any old icon.
					pnotify.container.find("div.ui-pnotify-icon").remove();
					if (opts.icon !== false) {
						// Build the new icon.
						$("<div />", {"class": "ui-pnotify-icon"})
						.append($("<span />", {"class": opts.icon === true ? (opts.type == "error" ? styles.error_icon : (opts.type == "info" ? styles.info_icon : (opts.type == "success" ? styles.success_icon : styles.notice_icon))) : opts.icon}))
						.prependTo(pnotify.container);
					}
				}
				// Update the width.
				if (opts.width !== old_opts.width)
					pnotify.animate({width: opts.width});
				// Update the minimum height.
				if (opts.min_height !== old_opts.min_height)
					pnotify.container.animate({minHeight: opts.min_height});
				// Update the opacity.
				if (opts.opacity !== old_opts.opacity)
					pnotify.fadeTo(opts.animate_speed, opts.opacity);
				// Update the sticker and closer buttons.
				if (!opts.closer || opts.nonblock)
					pnotify.closer.css("display", "none");
				else
					pnotify.closer.css("display", "block");
				if (!opts.sticker || opts.nonblock)
					pnotify.sticker.css("display", "none");
				else
					pnotify.sticker.css("display", "block");
				// Update the sticker icon.
				pnotify.sticker.trigger("pnotify_icon");
				// Update the hover status of the buttons.
				if (opts.sticker_hover)
					pnotify.sticker.css("visibility", "hidden");
				else if (!opts.nonblock)
					pnotify.sticker.css("visibility", "visible");
				if (opts.closer_hover)
					pnotify.closer.css("visibility", "hidden");
				else if (!opts.nonblock)
					pnotify.closer.css("visibility", "visible");
				// Update the timed hiding.
				if (!opts.hide)
					pnotify.pnotify_cancel_remove();
				else if (!old_opts.hide)
					pnotify.pnotify_queue_remove();
				pnotify.pnotify_queue_position();
				return pnotify;
			};

			// Position the notice. dont_skip_hidden causes the notice to
			// position even if it's not visible.
			pnotify.pnotify_position = function(dont_skip_hidden){
				// Get the notice's stack.
				var s = pnotify.opts.stack;
				if (!s) return;
				if (!s.nextpos1)
					s.nextpos1 = s.firstpos1;
				if (!s.nextpos2)
					s.nextpos2 = s.firstpos2;
				if (!s.addpos2)
					s.addpos2 = 0;
				var hidden = pnotify.css("display") == "none";
				// Skip this notice if it's not shown.
				if (!hidden || dont_skip_hidden) {
					var curpos1, curpos2;
					// Store what will need to be animated.
					var animate = {};
					// Calculate the current pos1 value.
					var csspos1;
					switch (s.dir1) {
						case "down":
							csspos1 = "top";
							break;
						case "up":
							csspos1 = "bottom";
							break;
						case "left":
							csspos1 = "right";
							break;
						case "right":
							csspos1 = "left";
							break;
					}
					curpos1 = parseInt(pnotify.css(csspos1));
					if (isNaN(curpos1))
						curpos1 = 0;
					// Remember the first pos1, so the first visible notice goes there.
					if (typeof s.firstpos1 == "undefined" && !hidden) {
						s.firstpos1 = curpos1;
						s.nextpos1 = s.firstpos1;
					}
					// Calculate the current pos2 value.
					var csspos2;
					switch (s.dir2) {
						case "down":
							csspos2 = "top";
							break;
						case "up":
							csspos2 = "bottom";
							break;
						case "left":
							csspos2 = "right";
							break;
						case "right":
							csspos2 = "left";
							break;
					}
					curpos2 = parseInt(pnotify.css(csspos2));
					if (isNaN(curpos2))
						curpos2 = 0;
					// Remember the first pos2, so the first visible notice goes there.
					if (typeof s.firstpos2 == "undefined" && !hidden) {
						s.firstpos2 = curpos2;
						s.nextpos2 = s.firstpos2;
					}
					// Check that it's not beyond the viewport edge.
					if ((s.dir1 == "down" && s.nextpos1 + pnotify.height() > jwindow.height()) ||
						(s.dir1 == "up" && s.nextpos1 + pnotify.height() > jwindow.height()) ||
						(s.dir1 == "left" && s.nextpos1 + pnotify.width() > jwindow.width()) ||
						(s.dir1 == "right" && s.nextpos1 + pnotify.width() > jwindow.width()) ) {
						// If it is, it needs to go back to the first pos1, and over on pos2.
						s.nextpos1 = s.firstpos1;
						s.nextpos2 += s.addpos2 + (typeof s.spacing2 == "undefined" ? 25 : s.spacing2);
						s.addpos2 = 0;
					}
					// Animate if we're moving on dir2.
					if (s.animation && s.nextpos2 < curpos2) {
						switch (s.dir2) {
							case "down":
								animate.top = s.nextpos2+"px";
								break;
							case "up":
								animate.bottom = s.nextpos2+"px";
								break;
							case "left":
								animate.right = s.nextpos2+"px";
								break;
							case "right":
								animate.left = s.nextpos2+"px";
								break;
						}
					} else {
						if(s.nextpos2)
							pnotify.css(csspos2, s.nextpos2+"px");
					}
					// Keep track of the widest/tallest notice in the column/row, so we can push the next column/row.
					switch (s.dir2) {
						case "down":
						case "up":
							if (pnotify.outerHeight(true) > s.addpos2)
								s.addpos2 = pnotify.height();
							break;
						case "left":
						case "right":
							if (pnotify.outerWidth(true) > s.addpos2)
								s.addpos2 = pnotify.width();
							break;
					}
					// Move the notice on dir1.
					if (s.nextpos1) {
						// Animate if we're moving toward the first pos.
						if (s.animation && (curpos1 > s.nextpos1 || animate.top || animate.bottom || animate.right || animate.left)) {
							switch (s.dir1) {
								case "down":
									animate.top = s.nextpos1+"px";
									break;
								case "up":
									animate.bottom = s.nextpos1+"px";
									break;
								case "left":
									animate.right = s.nextpos1+"px";
									break;
								case "right":
									animate.left = s.nextpos1+"px";
									break;
							}
						} else
							pnotify.css(csspos1, s.nextpos1+"px");
					}
					// Run the animation.
					if (animate.top || animate.bottom || animate.right || animate.left)
						pnotify.animate(animate, {duration: this.opts.position_animate_speed, queue: false});
					// Calculate the next dir1 position.
					switch (s.dir1) {
						case "down":
						case "up":
							s.nextpos1 += pnotify.height() + (typeof s.spacing1 == "undefined" ? 25 : s.spacing1);
							break;
						case "left":
						case "right":
							s.nextpos1 += pnotify.width() + (typeof s.spacing1 == "undefined" ? 25 : s.spacing1);
							break;
					}
				}
			};

			// Queue the positiona all function so it doesn't run repeatedly and
			// use up resources.
			pnotify.pnotify_queue_position = function(milliseconds){
				if (timer)
					clearTimeout(timer);
				if (!milliseconds)
					milliseconds = 10;
				timer = setTimeout($.pnotify_position_all, milliseconds);
			};

			// Display the notice.
			pnotify.pnotify_display = function() {
                // Remove oldest notifications leaving only opts.maxonscreen on screen
                notices_data = jwindow.data("pnotify");
                if (notices_data && (notices_data.length > opts.maxonscreen)) {
                    $.each(notices_data.slice(0, notices_data.length - opts.maxonscreen), function(){
                        if (this.pnotify_remove)
                            this.pnotify_remove();
                        });
                };
				// If the notice is not in the DOM, append it.
				if (!pnotify.parent().length)
					pnotify.appendTo(body);
				// Run callback.
				if (opts.before_open) {
					if (opts.before_open(pnotify) === false)
						return;
				}
				// Try to put it in the right position.
				if (opts.stack.push != "top")
					pnotify.pnotify_position(true);
				// First show it, then set its opacity, then hide it.
				if (opts.animation == "fade" || opts.animation.effect_in == "fade") {
					// If it's fading in, it should start at 0.
					pnotify.show().fadeTo(0, 0).hide();
				} else {
					// Or else it should be set to the opacity.
					if (opts.opacity != 1)
						pnotify.show().fadeTo(0, opts.opacity).hide();
				}
				pnotify.animate_in(function(){
					if (opts.after_open)
						opts.after_open(pnotify);

					pnotify.pnotify_queue_position();

					// Now set it to hide.
					if (opts.hide)
						pnotify.pnotify_queue_remove();
				});
			};

			// Remove the notice.
			pnotify.pnotify_remove = function() {
				if (pnotify.timer) {
					window.clearTimeout(pnotify.timer);
					pnotify.timer = null;
				}
				// Run callback.
				if (opts.before_close) {
					if (opts.before_close(pnotify) === false)
						return;
				}
				pnotify.animate_out(function(){
					if (opts.after_close) {
						if (opts.after_close(pnotify) === false)
							return;
					}
					pnotify.pnotify_queue_position();
					// If we're supposed to remove the notice from the DOM, do it.
					if (opts.remove)
						pnotify.detach();
				});
			};

			// Animate the notice in.
			pnotify.animate_in = function(callback){
				// Declare that the notice is animating in. (Or has completed animating in.)
				animating = "in";
				var animation;
				if (typeof opts.animation.effect_in != "undefined")
					animation = opts.animation.effect_in;
				else
					animation = opts.animation;
				if (animation == "none") {
					pnotify.show();
					callback();
				} else if (animation == "show")
					pnotify.show(opts.animate_speed, callback);
				else if (animation == "fade")
					pnotify.show().fadeTo(opts.animate_speed, opts.opacity, callback);
				else if (animation == "slide")
					pnotify.slideDown(opts.animate_speed, callback);
				else if (typeof animation == "function")
					animation("in", callback, pnotify);
				else
					pnotify.show(animation, (typeof opts.animation.options_in == "object" ? opts.animation.options_in : {}), opts.animate_speed, callback);
			};

			// Animate the notice out.
			pnotify.animate_out = function(callback){
				// Declare that the notice is animating out. (Or has completed animating out.)
				animating = "out";
				var animation;
				if (typeof opts.animation.effect_out != "undefined")
					animation = opts.animation.effect_out;
				else
					animation = opts.animation;
				if (animation == "none") {
					pnotify.hide();
					callback();
				} else if (animation == "show")
					pnotify.hide(opts.animate_speed, callback);
				else if (animation == "fade")
					pnotify.fadeOut(opts.animate_speed, callback);
				else if (animation == "slide")
					pnotify.slideUp(opts.animate_speed, callback);
				else if (typeof animation == "function")
					animation("out", callback, pnotify);
				else
					pnotify.hide(animation, (typeof opts.animation.options_out == "object" ? opts.animation.options_out : {}), opts.animate_speed, callback);
			};

			// Cancel any pending removal timer.
			pnotify.pnotify_cancel_remove = function() {
				if (pnotify.timer)
					window.clearTimeout(pnotify.timer);
			};

			// Queue a removal timer.
			pnotify.pnotify_queue_remove = function() {
				// Cancel any current removal timer.
				pnotify.pnotify_cancel_remove();
				pnotify.timer = window.setTimeout(function(){
					pnotify.pnotify_remove();
				}, (isNaN(opts.delay) ? 0 : opts.delay));
			};

			// Provide a button to close the notice.
			pnotify.closer = $("<div />", {
				"class": "ui-pnotify-closer",
				"css": {"cursor": "pointer", "visibility": opts.closer_hover ? "hidden" : "visible"},
				"click": function(){
					pnotify.pnotify_remove();
					pnotify.sticker.css("visibility", "hidden");
					pnotify.closer.css("visibility", "hidden");
				}
			})
			.append($("<span />", {"class": styles.closer, "title": opts.labels.close}))
			.appendTo(pnotify.container);
			if (!opts.closer || opts.nonblock)
				pnotify.closer.css("display", "none");

			// Provide a button to stick the notice.
			pnotify.sticker = $("<div />", {
				"class": "ui-pnotify-sticker",
				"css": {"cursor": "pointer", "visibility": opts.sticker_hover ? "hidden" : "visible"},
				"click": function(){
					opts.hide = !opts.hide;
					if (opts.hide)
						pnotify.pnotify_queue_remove();
					else
						pnotify.pnotify_cancel_remove();
					$(this).trigger("pnotify_icon");
				}
			})
			.bind("pnotify_icon", function(){
				$(this).children().removeClass(styles.pin_up+" "+styles.pin_down).addClass(opts.hide ? styles.pin_up : styles.pin_down);
			})
			.append($("<span />", {"class": styles.pin_up, "title": opts.labels.stick}))
			.appendTo(pnotify.container);
			if (!opts.sticker || opts.nonblock)
				pnotify.sticker.css("display", "none");

			// Add the appropriate icon.
			if (opts.icon !== false) {
				$("<div />", {"class": "ui-pnotify-icon"})
				.append($("<span />", {"class": opts.icon === true ? (opts.type == "error" ? styles.error_icon : (opts.type == "info" ? styles.info_icon : (opts.type == "success" ? styles.success_icon : styles.notice_icon))) : opts.icon}))
				.prependTo(pnotify.container);
			}

			// Add a title.
			pnotify.title_container = $("<span />", {
				"class": "ui-pnotify-title"
			})
			.appendTo(pnotify.container);
			if (opts.title === false)
				pnotify.title_container.hide();
			else if (opts.title_escape)
				pnotify.title_container.text(opts.title);
			else
				pnotify.title_container.html(opts.title);

			// Add text.
			pnotify.text_container = $("<div />", {
				"class": "ui-pnotify-text"
			})
			.appendTo(pnotify.container);
			if (opts.text === false)
				pnotify.text_container.hide();
			else if (opts.text_escape)
				pnotify.text_container.text(opts.text);
			else
				pnotify.text_container.html(opts.insert_brs ? String(opts.text).replace(/\n/g, "<br />") : opts.text);

			// Set width and min height.
			if (typeof opts.width == "string")
				pnotify.css("width", opts.width);
			if (typeof opts.min_height == "string")
				pnotify.container.css("min-height", opts.min_height);

			// The history variable controls whether the notice gets redisplayed
			// by the history pull down.
			pnotify.pnotify_history = opts.history;
			// The hide variable controls whether the history pull down should
			// queue a removal timer.
			pnotify.pnotify_hide = opts.hide;

			// Add the notice to the notice array.
			var notices_data = jwindow.data("pnotify");
			if (notices_data == null || typeof notices_data != "object")
				notices_data = [];
			if (opts.stack.push == "top")
				notices_data = $.merge([pnotify], notices_data);
			else
				notices_data = $.merge(notices_data, [pnotify]);
			jwindow.data("pnotify", notices_data);
			// Now position all the notices if they are to push to the top.
			if (opts.stack.push == "top")
				pnotify.pnotify_queue_position(1);

			// Run callback.
			if (opts.after_init)
				opts.after_init(pnotify);

			if (opts.history) {
				// If there isn't a history pull down, create one.
				var history_menu = jwindow.data("pnotify_history");
				if (typeof history_menu == "undefined") {
					history_menu = $("<div />", {
						"class": "ui-pnotify-history-container "+styles.hi_menu,
						"mouseleave": function(){
							history_menu.animate({top: "-"+history_handle_top+"px"}, {duration: 100, queue: false});
						}
					})
					.append($("<div />", {"class": "ui-pnotify-history-header", "text": opts.labels.redisplay}))
					.append($("<button />", {
							"class": "ui-pnotify-history-all "+styles.hi_btn,
							"text": opts.labels.all,
							"mouseenter": function(){
								$(this).addClass(styles.hi_btnhov);
							},
							"mouseleave": function(){
								$(this).removeClass(styles.hi_btnhov);
							},
							"click": function(){
								// Display all notices. (Disregarding non-history notices.)
								$.each(notices_data, function(){
									if (this.pnotify_history) {
										if (this.is(":visible")) {
											if (this.pnotify_hide)
												this.pnotify_queue_remove();
										} else if (this.pnotify_display)
											this.pnotify_display();
									}
								});
								return false;
							}
					}))
					.append($("<button />", {
							"class": "ui-pnotify-history-last "+styles.hi_btn,
							"text": opts.labels.last,
							"mouseenter": function(){
								$(this).addClass(styles.hi_btnhov);
							},
							"mouseleave": function(){
								$(this).removeClass(styles.hi_btnhov);
							},
							"click": function(){
								// Look up the last history notice, and display it.
								var i = -1;
								var notice;
								do {
									if (i == -1)
										notice = notices_data.slice(i);
									else
										notice = notices_data.slice(i, i+1);
									if (!notice[0])
										break;
									i--;
								} while (!notice[0].pnotify_history || notice[0].is(":visible"));
								if (!notice[0])
									return false;
								if (notice[0].pnotify_display)
									notice[0].pnotify_display();
								return false;
							}
					}))
					.appendTo(body);

					// Make a handle so the user can pull down the history tab.
					var handle = $("<span />", {
						"class": "ui-pnotify-history-pulldown "+styles.hi_hnd,
						"mouseenter": function(){
							history_menu.animate({top: "0"}, {duration: 100, queue: false});
						}
					})
					.appendTo(history_menu);

					// Get the top of the handle.
					history_handle_top = handle.offset().top + 2;
					// Hide the history pull down up to the top of the handle.
					history_menu.css({top: "-"+history_handle_top+"px"});
					// Save the history pull down.
					jwindow.data("pnotify_history", history_menu);
				}
			}

			// Mark the stack so it won't animate the new notice.
			opts.stack.animation = false;

			// Display the notice.
			if (opts.auto_display)
				pnotify.pnotify_display();

			return pnotify;
		}
	});

	// Some useful regexes.
	var re_on = /^on/,
		re_mouse_events = /^(dbl)?click$|^mouse(move|down|up|over|out|enter|leave)$|^contextmenu$/,
		re_ui_events = /^(focus|blur|select|change|reset)$|^key(press|down|up)$/,
		re_html_events = /^(scroll|resize|(un)?load|abort|error)$/;
	// Fire a DOM event.
	var dom_event = function(e, orig_e){
		var event_object;
		e = e.toLowerCase();
		if (document.createEvent && this.dispatchEvent) {
			// FireFox, Opera, Safari, Chrome
			e = e.replace(re_on, '');
			if (e.match(re_mouse_events)) {
				// This allows the click event to fire on the notice. There is
				// probably a much better way to do it.
				$(this).offset();
				event_object = document.createEvent("MouseEvents");
				event_object.initMouseEvent(
					e, orig_e.bubbles, orig_e.cancelable, orig_e.view, orig_e.detail,
					orig_e.screenX, orig_e.screenY, orig_e.clientX, orig_e.clientY,
					orig_e.ctrlKey, orig_e.altKey, orig_e.shiftKey, orig_e.metaKey, orig_e.button, orig_e.relatedTarget
				);
			} else if (e.match(re_ui_events)) {
				event_object = document.createEvent("UIEvents");
				event_object.initUIEvent(e, orig_e.bubbles, orig_e.cancelable, orig_e.view, orig_e.detail);
			} else if (e.match(re_html_events)) {
				event_object = document.createEvent("HTMLEvents");
				event_object.initEvent(e, orig_e.bubbles, orig_e.cancelable);
			}
			if (!event_object) return;
			this.dispatchEvent(event_object);
		} else {
			// Internet Explorer
			if (!e.match(re_on)) e = "on"+e;
			event_object = document.createEventObject(orig_e);
			this.fireEvent(e, event_object);
		}
	};

	$.pnotify.defaults = {
		// The notice's title.
		title: false,
		// Whether to escape the content of the title. (Not allow HTML.)
		title_escape: false,
		// The notice's text.
		text: false,
		// Whether to escape the content of the text. (Not allow HTML.)
		text_escape: false,
		// What styling classes to use. (Can be either jqueryui or bootstrap.)
		styling: "bootstrap",
		// Additional classes to be added to the notice. (For custom styling.)
		addclass: "",
		// Class to be added to the notice for corner styling.
		cornerclass: "",
		// Create a non-blocking notice. It lets the user click elements underneath it.
		nonblock: false,
		// The opacity of the notice (if it's non-blocking) when the mouse is over it.
		nonblock_opacity: .2,
		// Display a pull down menu to redisplay previous notices, and place the notice in the history.
		history: true,
        // Maximum number of notifications to have onscreen
        maxonscreen: Infinity,
		// Display the notice when it is created. Turn this off to add notifications to the history without displaying them.
		auto_display: true,
		// Width of the notice.
		width: "300px",
		// Minimum height of the notice. It will expand to fit content.
		min_height: "16px",
		// Type of the notice. "notice", "info", "success", or "error".
		type: "notice",
		// Set icon to true to use the default icon for the selected style/type, false for no icon, or a string for your own icon class.
		icon: true,
		// The animation to use when displaying and hiding the notice. "none", "show", "fade", and "slide" are built in to jQuery. Others require jQuery UI. Use an object with effect_in and effect_out to use different effects.
		animation: "fade",
		// Speed at which the notice animates in and out. "slow", "def" or "normal", "fast" or number of milliseconds.
		animate_speed: "slow",
		// Specify a specific duration of position animation
		position_animate_speed: 500,
		// Opacity of the notice.
		opacity: 1,
		// Display a drop shadow.
		shadow: true,
		// Provide a button for the user to manually close the notice.
		closer: true,
		// Only show the closer button on hover.
		closer_hover: true,
		// Provide a button for the user to manually stick the notice.
		sticker: true,
		// Only show the sticker button on hover.
		sticker_hover: true,
		// After a delay, remove the notice.
		hide: true,
		// Delay in milliseconds before the notice is removed.
		delay: 8000,
		// Reset the hide timer if the mouse moves over the notice.
		mouse_reset: true,
		// Remove the notice's elements from the DOM after it is removed.
		remove: true,
		// Change new lines to br tags.
		insert_brs: true,
		// The stack on which the notices will be placed. Also controls the direction the notices stack.
		stack: {"dir1": "down", "dir2": "left", "push": "bottom", "spacing1": 25, "spacing2": 25},
                //Lets you change the displayed text, facilitating the internationalization.
                labels: {
                    redisplay: "Redisplay",
                    all: "All",
                    last: "Last",
                    close: "Close",
                    stick: "Stick"
                }
	};
})(jQuery);;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/jquery-pnotify.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/classlist.js
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 2012-11-15
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
// <ie>
if ("document" in self && !(
                "classList" in document.createElement("_") &&
                "classList" in document.createElementNS("http://www.w3.org/2000/svg", "svg")
        )) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
          classListProp = "classList"
        , protoProp = "prototype"
        , elemCtrProto = view.Element[protoProp]
        , objCtr = Object
        , strTrim = String[protoProp].trim || function () {
                return this.replace(/^\s+|\s+$/g, "");
        }
        , arrIndexOf = Array[protoProp].indexOf || function (item) {
                var
                          i = 0
                        , len = this.length
                ;
                for (; i < len; i++) {
                        if (i in this && this[i] === item) {
                                return i;
                        }
                }
                return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        , DOMEx = function (type, message) {
                this.name = type;
                this.code = DOMException[type];
                this.message = message;
        }
        , checkTokenAndGetIndex = function (classList, token) {
                if (token === "") {
                        throw new DOMEx(
                                  "SYNTAX_ERR"
                                , "An invalid or illegal string was specified"
                        );
                }
                if (/\s/.test(token)) {
                        throw new DOMEx(
                                  "INVALID_CHARACTER_ERR"
                                , "String contains an invalid character"
                        );
                }
                return arrIndexOf.call(classList, token);
        }
        , ClassList = function (elem) {
                var
                          trimmedClasses = strTrim.call(elem.getAttribute("class"))
                        , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                        , i = 0
                        , len = classes.length
                ;
                for (; i < len; i++) {
                        this.push(classes[i]);
                }
                this._updateClassName = function () {
                        elem.setAttribute("class", this.toString());
                };
        }
        , classListProto = ClassList[protoProp] = []
        , classListGetter = function () {
                return new ClassList(this);
        }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
        return this[i] || null;
};
classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
        var
                  tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
        ;
        do {
                token = tokens[i] + "";
                if (checkTokenAndGetIndex(this, token) === -1) {
                        this.push(token);
                        updated = true;
                }
        }
        while (++i < l);

        if (updated) {
                this._updateClassName();
        }
};
classListProto.remove = function () {
        var
                  tokens = arguments
                , i = 0
                , l = tokens.length
                , token
                , updated = false
        ;
        do {
                token = tokens[i] + "";
                var index = checkTokenAndGetIndex(this, token);
                if (index !== -1) {
                        this.splice(index, 1);
                        updated = true;
                }
        }
        while (++i < l);

        if (updated) {
                this._updateClassName();
        }
};
classListProto.toggle = function (token, forse) {
        token += "";

        var
                  result = this.contains(token)
                , method = result ?
                        forse !== true && "remove"
                :
                        forse !== false && "add"
        ;

        if (method) {
                this[method](token);
        }

        return !result;
};
classListProto.toString = function () {
        return this.join(" ");
};

if (objCtr.defineProperty) {
        var classListPropDesc = {
                  get: classListGetter
                , enumerable: true
                , configurable: true
        };
        try {
                objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) { // IE 8 doesn't support enumerable:true
                if (ex.number === -0x7FF5EC54) {
                        classListPropDesc.enumerable = false;
                        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                }
        }
} else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

}
// </ie>
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/classlist.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/pixastic.custom.js
/*
 * Pixastic Lib - Core Functions - v0.1.3
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

var Pixastic = (function() {


	function addEvent(el, event, handler) {
		if (el.addEventListener)
			el.addEventListener(event, handler, false);
		else if (el.attachEvent)
			el.attachEvent("on" + event, handler);
	}

	function onready(handler) {
		var handlerDone = false;
		var execHandler = function() {
			if (!handlerDone) {
				handlerDone = true;
				handler();
			}
		}
		document.write("<"+"script defer src=\"//:\" id=\"__onload_ie_pixastic__\"></"+"script>");
		var script = document.getElementById("__onload_ie_pixastic__");
		script.onreadystatechange = function() {
			if (script.readyState == "complete") {
				script.parentNode.removeChild(script);
				execHandler();
			}
		}
		if (document.addEventListener)
			document.addEventListener("DOMContentLoaded", execHandler, false);
		addEvent(window, "load", execHandler);
	}

	function init() {
		var imgEls = getElementsByClass("pixastic", null, "img");
		var canvasEls = getElementsByClass("pixastic", null, "canvas");
		var elements = imgEls.concat(canvasEls);
		for (var i=0;i<elements.length;i++) {
			(function() {

			var el = elements[i];
			var actions = [];
			var classes = el.className.split(" ");
			for (var c=0;c<classes.length;c++) {
				var cls = classes[c];
				if (cls.substring(0,9) == "pixastic-") {
					var actionName = cls.substring(9);
					if (actionName != "")
						actions.push(actionName);
				}
			}
			if (actions.length) {
				if (el.tagName.toLowerCase() == "img") {
					var dataImg = new Image();
					dataImg.src = el.src;
					if (dataImg.complete) {
						for (var a=0;a<actions.length;a++) {
							var res = Pixastic.applyAction(el, el, actions[a], null);
							if (res)
								el = res;
						}
					} else {
						dataImg.onload = function() {
							for (var a=0;a<actions.length;a++) {
								var res = Pixastic.applyAction(el, el, actions[a], null)
								if (res)
									el = res;
							}
						}
					}
				} else {
					setTimeout(function() {
						for (var a=0;a<actions.length;a++) {
							var res = Pixastic.applyAction(
								el, el, actions[a], null
							);
							if (res)
								el = res;
						}
					},1);
				}
			}

			})();
		}
	}

	if (typeof pixastic_parseonload != "undefined" && pixastic_parseonload)
		onready(init);

	// getElementsByClass by Dustin Diaz, http://www.dustindiaz.com/getelementsbyclass/
	function getElementsByClass(searchClass,node,tag) {
	        var classElements = new Array();
	        if ( node == null )
	                node = document;
	        if ( tag == null )
	                tag = '*';

	        var els = node.getElementsByTagName(tag);
	        var elsLen = els.length;
	        var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	        for (i = 0, j = 0; i < elsLen; i++) {
	                if ( pattern.test(els[i].className) ) {
	                        classElements[j] = els[i];
	                        j++;
	                }
	        }
	        return classElements;
	}

	var debugElement;

	function writeDebug(text, level) {
		if (!Pixastic.debug) return;
		try {
			switch (level) {
				case "warn" :
					console.warn("Pixastic:", text);
					break;
				case "error" :
					console.error("Pixastic:", text);
					break;
				default:
					console.log("Pixastic:", text);
			}
		} catch(e) {
		}
		if (!debugElement) {

		}
	}

	// canvas capability checks

	var hasCanvas = (function() {
		var c = document.createElement("canvas");
		var val = false;
		try {
			val = !!((typeof c.getContext == "function") && c.getContext("2d"));
		} catch(e) {}
		return function() {
			return val;
		}
	})();

	var hasCanvasImageData = (function() {
		var c = document.createElement("canvas");
		var val = false;
		var ctx;
		try {
			if (typeof c.getContext == "function" && (ctx = c.getContext("2d"))) {
				val = (typeof ctx.getImageData == "function");
			}
		} catch(e) {}
		return function() {
			return val;
		}
	})();

	var hasGlobalAlpha = (function() {
		var hasAlpha = false;
		var red = document.createElement("canvas");
		if (hasCanvas() && hasCanvasImageData()) {
			red.width = red.height = 1;
			var redctx = red.getContext("2d");
			redctx.fillStyle = "rgb(255,0,0)";
			redctx.fillRect(0,0,1,1);

			var blue = document.createElement("canvas");
			blue.width = blue.height = 1;
			var bluectx = blue.getContext("2d");
			bluectx.fillStyle = "rgb(0,0,255)";
			bluectx.fillRect(0,0,1,1);

			redctx.globalAlpha = 0.5;
			redctx.drawImage(blue, 0, 0);
			var reddata = redctx.getImageData(0,0,1,1).data;

			hasAlpha = (reddata[2] != 255);
		}
		return function() {
			return hasAlpha;
		}
	})();


	// return public interface

	return {

		parseOnLoad : false,

		debug : false,

		applyAction : function(img, dataImg, actionName, options) {

			options = options || {};

			var imageIsCanvas = (img.tagName.toLowerCase() == "canvas");
			if (imageIsCanvas && Pixastic.Client.isIE()) {
				if (Pixastic.debug) writeDebug("Tried to process a canvas element but browser is IE.");
				return false;
			}

			var canvas, ctx;
			var hasOutputCanvas = false;
			if (Pixastic.Client.hasCanvas()) {
				hasOutputCanvas = !!options.resultCanvas;
				canvas = options.resultCanvas || document.createElement("canvas");
				ctx = canvas.getContext("2d");
			}

			var w = img.offsetWidth;
			var h = img.offsetHeight;

			if (imageIsCanvas) {
				w = img.width;
				h = img.height;
			}

			// offsetWidth/Height might be 0 if the image is not in the document
			if (w == 0 || h == 0) {
				if (img.parentNode == null) {
					// add the image to the doc (way out left), read its dimensions and remove it again
					var oldpos = img.style.position;
					var oldleft = img.style.left;
					img.style.position = "absolute";
					img.style.left = "-9999px";
					document.body.appendChild(img);
					w = img.offsetWidth;
					h = img.offsetHeight;
					document.body.removeChild(img);
					img.style.position = oldpos;
					img.style.left = oldleft;
				} else {
					if (Pixastic.debug) writeDebug("Image has 0 width and/or height.");
					return;
				}
			}

			if (actionName.indexOf("(") > -1) {
				var tmp = actionName;
				actionName = tmp.substr(0, tmp.indexOf("("));
				var arg = tmp.match(/\((.*?)\)/);
				if (arg[1]) {
					arg = arg[1].split(";");
					for (var a=0;a<arg.length;a++) {
						thisArg = arg[a].split("=");
						if (thisArg.length == 2) {
							if (thisArg[0] == "rect") {
								var rectVal = thisArg[1].split(",");
								options[thisArg[0]] = {
									left : parseInt(rectVal[0],10)||0,
									top : parseInt(rectVal[1],10)||0,
									width : parseInt(rectVal[2],10)||0,
									height : parseInt(rectVal[3],10)||0
								}
							} else {
								options[thisArg[0]] = thisArg[1];
							}
						}
					}
				}
			}

			if (!options.rect) {
				options.rect = {
					left : 0, top : 0, width : w, height : h
				};
			} else {
				options.rect.left = Math.round(options.rect.left);
				options.rect.top = Math.round(options.rect.top);
				options.rect.width = Math.round(options.rect.width);
				options.rect.height = Math.round(options.rect.height);
			}

			var validAction = false;
			if (Pixastic.Actions[actionName] && typeof Pixastic.Actions[actionName].process == "function") {
				validAction = true;
			}
			if (!validAction) {
				if (Pixastic.debug) writeDebug("Invalid action \"" + actionName + "\". Maybe file not included?");
				return false;
			}
			if (!Pixastic.Actions[actionName].checkSupport()) {
				if (Pixastic.debug) writeDebug("Action \"" + actionName + "\" not supported by this browser.");
				return false;
			}

			if (Pixastic.Client.hasCanvas()) {
				if (canvas !== img) {
					canvas.width = w;
					canvas.height = h;
				}
				if (!hasOutputCanvas) {
					canvas.style.width = w+"px";
					canvas.style.height = h+"px";
				}
				ctx.drawImage(dataImg,0,0,w,h);

				if (!img.__pixastic_org_image) {
					canvas.__pixastic_org_image = img;
					canvas.__pixastic_org_width = w;
					canvas.__pixastic_org_height = h;
				} else {
					canvas.__pixastic_org_image = img.__pixastic_org_image;
					canvas.__pixastic_org_width = img.__pixastic_org_width;
					canvas.__pixastic_org_height = img.__pixastic_org_height;
				}

			} else if (Pixastic.Client.isIE() && typeof img.__pixastic_org_style == "undefined") {
				img.__pixastic_org_style = img.style.cssText;
			}

			var params = {
				image : img,
				canvas : canvas,
				width : w,
				height : h,
				useData : true,
				options : options
			}

			// Ok, let's do it!

			var res = Pixastic.Actions[actionName].process(params);

			if (!res) {
				return false;
			}

			if (Pixastic.Client.hasCanvas()) {
				if (params.useData) {
					if (Pixastic.Client.hasCanvasImageData()) {
						canvas.getContext("2d").putImageData(params.canvasData, options.rect.left, options.rect.top);

						// Opera doesn't seem to update the canvas until we draw something on it, lets draw a 0x0 rectangle.
						// Is this still so?
						canvas.getContext("2d").fillRect(0,0,0,0);
					}
				}

				if (!options.leaveDOM) {
					// copy properties and stuff from the source image
					canvas.title = img.title;
					canvas.imgsrc = img.imgsrc;
					if (!imageIsCanvas) canvas.alt  = img.alt;
					if (!imageIsCanvas) canvas.imgsrc = img.src;
					canvas.className = img.className;
					canvas.style.cssText = img.style.cssText;
					canvas.name = img.name;
					canvas.tabIndex = img.tabIndex;
					canvas.id = img.id;
					if (img.parentNode && img.parentNode.replaceChild) {
						img.parentNode.replaceChild(canvas, img);
					}
				}

				options.resultCanvas = canvas;

				return canvas;
			}

			return img;
		},

		prepareData : function(params, getCopy) {
			var ctx = params.canvas.getContext("2d");
			var rect = params.options.rect;
			var dataDesc = ctx.getImageData(rect.left, rect.top, rect.width, rect.height);
			var data = dataDesc.data;
			if (!getCopy) params.canvasData = dataDesc;
			return data;
		},

		// load the image file
		process : function(img, actionName, options, callback) {
			if (img.tagName.toLowerCase() == "img") {
				var dataImg = new Image();
				dataImg.src = img.src;
				if (dataImg.complete) {
					var res = Pixastic.applyAction(img, dataImg, actionName, options);
					if (callback) callback(res);
					return res;
				} else {
					dataImg.onload = function() {
						var res = Pixastic.applyAction(img, dataImg, actionName, options)
						if (callback) callback(res);
					}
				}
			}
			if (img.tagName.toLowerCase() == "canvas") {
				var res = Pixastic.applyAction(img, img, actionName, options);
				if (callback) callback(res);
				return res;
			}
		},

		revert : function(img) {
			if (Pixastic.Client.hasCanvas()) {
				if (img.tagName.toLowerCase() == "canvas" && img.__pixastic_org_image) {
					img.width = img.__pixastic_org_width;
					img.height = img.__pixastic_org_height;
					img.getContext("2d").drawImage(img.__pixastic_org_image, 0, 0);

					if (img.parentNode && img.parentNode.replaceChild) {
						img.parentNode.replaceChild(img.__pixastic_org_image, img);
					}

					return img;
				}
			} else if (Pixastic.Client.isIE()) {
 				if (typeof img.__pixastic_org_style != "undefined")
					img.style.cssText = img.__pixastic_org_style;
			}
		},

		Client : {
			hasCanvas : hasCanvas,
			hasCanvasImageData : hasCanvasImageData,
			hasGlobalAlpha : hasGlobalAlpha,
			isIE : function() {
				return !!document.all && !!window.attachEvent && !window.opera;
			}
		},

		Actions : {}
	}


})();
/*
 * Pixastic Lib - Blur filter - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.blur = {
	process : function(params) {

		if (typeof params.options.fixMargin == "undefined")
			params.options.fixMargin = true;

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var dataCopy = Pixastic.prepareData(params, true)

			/*
			var kernel = [
				[0.5, 	1, 	0.5],
				[1, 	2, 	1],
				[0.5, 	1, 	0.5]
			];
			*/

			var kernel = [
				[0, 	1, 	0],
				[1, 	2, 	1],
				[0, 	1, 	0]
			];

			var weight = 0;
			for (var i=0;i<3;i++) {
				for (var j=0;j<3;j++) {
					weight += kernel[i][j];
				}
			}

			weight = 1 / (weight*2);

			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;

			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;

				var prevY = (y == 1) ? 0 : y-2;
				var nextY = (y == h) ? y - 1 : y;

				var offsetYPrev = prevY*w*4;
				var offsetYNext = nextY*w*4;

				var x = w;
				do {
					var offset = offsetY + (x*4-4);

					var offsetPrev = offsetYPrev + ((x == 1) ? 0 : x-2) * 4;
					var offsetNext = offsetYNext + ((x == w) ? x-1 : x) * 4;

					data[offset] = (
						/*
						dataCopy[offsetPrev - 4]
						+ dataCopy[offsetPrev+4]
						+ dataCopy[offsetNext - 4]
						+ dataCopy[offsetNext+4]
						+
						*/
						(dataCopy[offsetPrev]
						+ dataCopy[offset-4]
						+ dataCopy[offset+4]
						+ dataCopy[offsetNext])		* 2
						+ dataCopy[offset] 		* 4
						) * weight;

					data[offset+1] = (
						/*
						dataCopy[offsetPrev - 3]
						+ dataCopy[offsetPrev+5]
						+ dataCopy[offsetNext - 3]
						+ dataCopy[offsetNext+5]
						+
						*/
						(dataCopy[offsetPrev+1]
						+ dataCopy[offset-3]
						+ dataCopy[offset+5]
						+ dataCopy[offsetNext+1])	* 2
						+ dataCopy[offset+1] 		* 4
						) * weight;

					data[offset+2] = (
						/*
						dataCopy[offsetPrev - 2]
						+ dataCopy[offsetPrev+6]
						+ dataCopy[offsetNext - 2]
						+ dataCopy[offsetNext+6]
						+
						*/
						(dataCopy[offsetPrev+2]
						+ dataCopy[offset-2]
						+ dataCopy[offset+6]
						+ dataCopy[offsetNext+2])	* 2
						+ dataCopy[offset+2] 		* 4
						) * weight;

				} while (--x);
			} while (--y);

			return true;

		} else if (Pixastic.Client.isIE()) {
			params.image.style.filter += " progid:DXImageTransform.Microsoft.Blur(pixelradius=1.5)";

			if (params.options.fixMargin) {
				params.image.style.marginLeft = (parseInt(params.image.style.marginLeft,10)||0) - 2 + "px";
				params.image.style.marginTop = (parseInt(params.image.style.marginTop,10)||0) - 2 + "px";
			}

			return true;
		}
	},
	checkSupport : function() {
		return (Pixastic.Client.hasCanvasImageData() || Pixastic.Client.isIE());
	}
}/*
 * Pixastic Lib - Brightness/Contrast filter - v0.1.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.brightness = {

	process : function(params) {

		var brightness = parseInt(params.options.brightness,10) || 0;
		var contrast = parseFloat(params.options.contrast)||0;
		var legacy = !!(params.options.legacy && params.options.legacy != "false");

		if (legacy) {
			brightness = Math.min(150,Math.max(-150,brightness));
		} else {
			var brightMul = 1 + Math.min(150,Math.max(-150,brightness)) / 150;
		}
		contrast = Math.max(0,contrast+1);

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;

			var p = w*h;
			var pix = p*4, pix1, pix2;

			var mul, add;
			if (contrast != 1) {
				if (legacy) {
					mul = contrast;
					add = (brightness - 128) * contrast + 128;
				} else {
					mul = brightMul * contrast;
					add = - contrast * 128 + 128;
				}
			} else {  // this if-then is not necessary anymore, is it?
				if (legacy) {
					mul = 1;
					add = brightness;
				} else {
					mul = brightMul;
					add = 0;
				}
			}
			var r, g, b;
			while (p--) {
				if ((r = data[pix-=4] * mul + add) > 255 )
					data[pix] = 255;
				else if (r < 0)
					data[pix] = 0;
				else
 					data[pix] = r;

				if ((g = data[pix1=pix+1] * mul + add) > 255 )
					data[pix1] = 255;
				else if (g < 0)
					data[pix1] = 0;
				else
					data[pix1] = g;

				if ((b = data[pix2=pix+2] * mul + add) > 255 )
					data[pix2] = 255;
				else if (b < 0)
					data[pix2] = 0;
				else
					data[pix2] = b;
			}
			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}

/*
 * Pixastic Lib - Color adjust filter - v0.1.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.coloradjust = {

	process : function(params) {
		var red = parseFloat(params.options.red) || 0;
		var green = parseFloat(params.options.green) || 0;
		var blue = parseFloat(params.options.blue) || 0;

		red = Math.round(red*255);
		green = Math.round(green*255);
		blue = Math.round(blue*255);

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var rect = params.options.rect;

			var p = rect.width*rect.height;
			var pix = p*4, pix1, pix2;

			var r, g, b;
			while (p--) {
				pix -= 4;

				if (red) {
					if ((r = data[pix] + red) < 0 )
						data[pix] = 0;
					else if (r > 255 )
						data[pix] = 255;
					else
						data[pix] = r;
				}

				if (green) {
					if ((g = data[pix1=pix+1] + green) < 0 )
						data[pix1] = 0;
					else if (g > 255 )
						data[pix1] = 255;
					else
						data[pix1] = g;
				}

				if (blue) {
					if ((b = data[pix2=pix+2] + blue) < 0 )
						data[pix2] = 0;
					else if (b > 255 )
						data[pix2] = 255;
					else
						data[pix2] = b;
				}
			}
			return true;
		}
	},
	checkSupport : function() {
		return (Pixastic.Client.hasCanvasImageData());
	}
}
/*
 * Pixastic Lib - Desaturation filter - v0.1.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.desaturate = {

	process : function(params) {
		var useAverage = !!(params.options.average && params.options.average != "false");

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;

			var p = w*h;
			var pix = p*4, pix1, pix2;

			if (useAverage) {
				while (p--)
					data[pix-=4] = data[pix1=pix+1] = data[pix2=pix+2] = (data[pix]+data[pix1]+data[pix2])/3
			} else {
				while (p--)
					data[pix-=4] = data[pix1=pix+1] = data[pix2=pix+2] = (data[pix]*0.3 + data[pix1]*0.59 + data[pix2]*0.11);
			}
			return true;
		} else if (Pixastic.Client.isIE()) {
			params.image.style.filter += " gray";
			return true;
		}
	},
	checkSupport : function() {
		return (Pixastic.Client.hasCanvasImageData() || Pixastic.Client.isIE());
	}
}/*
 * Pixastic Lib - Glow - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */


Pixastic.Actions.glow = {
	process : function(params) {

		var amount = (parseFloat(params.options.amount)||0);
		var blurAmount = parseFloat(params.options.radius)||0;

		amount = Math.min(1,Math.max(0,amount));
		blurAmount = Math.min(5,Math.max(0,blurAmount));

		if (Pixastic.Client.hasCanvasImageData()) {
			var rect = params.options.rect;

			var blurCanvas = document.createElement("canvas");
			blurCanvas.width = params.width;
			blurCanvas.height = params.height;
			var blurCtx = blurCanvas.getContext("2d");
			blurCtx.drawImage(params.canvas,0,0);

			var scale = 2;
			var smallWidth = Math.round(params.width / scale);
			var smallHeight = Math.round(params.height / scale);

			var copy = document.createElement("canvas");
			copy.width = smallWidth;
			copy.height = smallHeight;

			var clear = true;
			var steps = Math.round(blurAmount * 20);

			var copyCtx = copy.getContext("2d");
			for (var i=0;i<steps;i++) {
				var scaledWidth = Math.max(1,Math.round(smallWidth - i));
				var scaledHeight = Math.max(1,Math.round(smallHeight - i));

				copyCtx.clearRect(0,0,smallWidth,smallHeight);

				copyCtx.drawImage(
					blurCanvas,
					0,0,params.width,params.height,
					0,0,scaledWidth,scaledHeight
				);

				blurCtx.clearRect(0,0,params.width,params.height);

				blurCtx.drawImage(
					copy,
					0,0,scaledWidth,scaledHeight,
					0,0,params.width,params.height
				);
			}

			var data = Pixastic.prepareData(params);
			var blurData = Pixastic.prepareData({canvas:blurCanvas,options:params.options});

			var p = rect.width * rect.height;

			var pix = p*4, pix1 = pix + 1, pix2 = pix + 2, pix3 = pix + 3;
			while (p--) {
				if ((data[pix-=4] += amount * blurData[pix]) > 255) data[pix] = 255;
				if ((data[pix1-=4] += amount * blurData[pix1]) > 255) data[pix1] = 255;
				if ((data[pix2-=4] += amount * blurData[pix2]) > 255) data[pix2] = 255;
			}

			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}



/*
 * Pixastic Lib - HSL Adjust  - v0.1.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.hsl = {
	process : function(params) {

		var hue = parseInt(params.options.hue,10)||0;
		var saturation = (parseInt(params.options.saturation,10)||0) / 100;
		var lightness = (parseInt(params.options.lightness,10)||0) / 100;


		// this seems to give the same result as Photoshop
		if (saturation < 0) {
			var satMul = 1+saturation;
		} else {
			var satMul = 1+saturation*2;
		}

		hue = (hue%360) / 360;
		var hue6 = hue * 6;

		var rgbDiv = 1 / 255;

		var light255 = lightness * 255;
		var lightp1 = 1 + lightness;
		var lightm1 = 1 - lightness;
		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);

			var rect = params.options.rect;

			var p = rect.width * rect.height;

			var pix = p*4, pix1 = pix + 1, pix2 = pix + 2, pix3 = pix + 3;

			while (p--) {

				var r = data[pix-=4];
				var g = data[pix1=pix+1];
				var b = data[pix2=pix+2];

				if (hue != 0 || saturation != 0) {
					// ok, here comes rgb to hsl + adjust + hsl to rgb, all in one jumbled mess.
					// It's not so pretty, but it's been optimized to get somewhat decent performance.
					// The transforms were originally adapted from the ones found in Graphics Gems, but have been heavily modified.
					var vs = r;
					if (g > vs) vs = g;
					if (b > vs) vs = b;
					var ms = r;
					if (g < ms) ms = g;
					if (b < ms) ms = b;
					var vm = (vs-ms);
					var l = (ms+vs)/510;
					if (l > 0) {
						if (vm > 0) {
							if (l <= 0.5) {
								var s = vm / (vs+ms) * satMul;
								if (s > 1) s = 1;
								var v = (l * (1+s));
							} else {
								var s = vm / (510-vs-ms) * satMul;
								if (s > 1) s = 1;
								var v = (l+s - l*s);
							}
							if (r == vs) {
								if (g == ms)
									var h = 5 + ((vs-b)/vm) + hue6;
								else
									var h = 1 - ((vs-g)/vm) + hue6;
							} else if (g == vs) {
								if (b == ms)
									var h = 1 + ((vs-r)/vm) + hue6;
								else
									var h = 3 - ((vs-b)/vm) + hue6;
							} else {
								if (r == ms)
									var h = 3 + ((vs-g)/vm) + hue6;
								else
									var h = 5 - ((vs-r)/vm) + hue6;
							}
							if (h < 0) h+=6;
							if (h >= 6) h-=6;
							var m = (l+l-v);
							var sextant = h>>0;
							if (sextant == 0) {
								r = v*255; g = (m+((v-m)*(h-sextant)))*255; b = m*255;
							} else if (sextant == 1) {
								r = (v-((v-m)*(h-sextant)))*255; g = v*255; b = m*255;
							} else if (sextant == 2) {
								r = m*255; g = v*255; b = (m+((v-m)*(h-sextant)))*255;
							} else if (sextant == 3) {
								r = m*255; g = (v-((v-m)*(h-sextant)))*255; b = v*255;
							} else if (sextant == 4) {
								r = (m+((v-m)*(h-sextant)))*255; g = m*255; b = v*255;
							} else if (sextant == 5) {
								r = v*255; g = m*255; b = (v-((v-m)*(h-sextant)))*255;
							}
						}
					}
				}

				if (lightness < 0) {
					r *= lightp1;
					g *= lightp1;
					b *= lightp1;
				} else if (lightness > 0) {
					r = r * lightm1 + light255;
					g = g * lightm1 + light255;
					b = b * lightm1 + light255;
				}

				if (r < 0)
					data[pix] = 0
				else if (r > 255)
					data[pix] = 255
				else
					data[pix] = r;

				if (g < 0)
					data[pix1] = 0
				else if (g > 255)
					data[pix1] = 255
				else
					data[pix1] = g;

				if (b < 0)
					data[pix2] = 0
				else if (b > 255)
					data[pix2] = 255
				else
					data[pix2] = b;

			}

			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}

}
/*
 * Pixastic Lib - Invert filter - v0.1.1
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.invert = {
	process : function(params) {
		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);

			var invertAlpha = !!params.options.invertAlpha;
			var rect = params.options.rect;

			var p = rect.width * rect.height;

			var pix = p*4, pix1 = pix + 1, pix2 = pix + 2, pix3 = pix + 3;

			while (p--) {
				data[pix-=4] = 255 - data[pix];
				data[pix1-=4] = 255 - data[pix1];
				data[pix2-=4] = 255 - data[pix2];
				if (invertAlpha)
					data[pix3-=4] = 255 - data[pix3];
			}

			return true;
		} else if (Pixastic.Client.isIE()) {
			params.image.style.filter += " invert";
			return true;
		}
	},
	checkSupport : function() {
		return (Pixastic.Client.hasCanvasImageData() || Pixastic.Client.isIE());
	}
}
/*
 * Pixastic Lib - Posterize effect - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.posterize = {

	process : function(params) {


		var numLevels = 256;
		if (typeof params.options.levels != "undefined")
			numLevels = parseInt(params.options.levels,10)||1;

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);

			numLevels = Math.max(2,Math.min(256,numLevels));

			var numAreas = 256 / numLevels;
			var numValues = 256 / (numLevels-1);

			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;
			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;
				var x = w;
				do {
					var offset = offsetY + (x-1)*4;

					var r = numValues * ((data[offset] / numAreas)>>0);
					var g = numValues * ((data[offset+1] / numAreas)>>0);
					var b = numValues * ((data[offset+2] / numAreas)>>0);

					if (r > 255) r = 255;
					if (g > 255) g = 255;
					if (b > 255) b = 255;

					data[offset] = r;
					data[offset+1] = g;
					data[offset+2] = b;

				} while (--x);
			} while (--y);
			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}


/*
 * Pixastic Lib - Remove noise - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.removenoise = {
	process : function(params) {

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);

			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;

			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;

				var nextY = (y == h) ? y - 1 : y;
				var prevY = (y == 1) ? 0 : y-2;

				var offsetYPrev = prevY*w*4;
				var offsetYNext = nextY*w*4;

				var x = w;
				do {
					var offset = offsetY + (x*4-4);

					var offsetPrev = offsetYPrev + ((x == 1) ? 0 : x-2) * 4;
					var offsetNext = offsetYNext + ((x == w) ? x-1 : x) * 4;

					var minR, maxR, minG, maxG, minB, maxB;

					minR = maxR = data[offsetPrev];
					var r1 = data[offset-4], r2 = data[offset+4], r3 = data[offsetNext];
					if (r1 < minR) minR = r1;
					if (r2 < minR) minR = r2;
					if (r3 < minR) minR = r3;
					if (r1 > maxR) maxR = r1;
					if (r2 > maxR) maxR = r2;
					if (r3 > maxR) maxR = r3;

					minG = maxG = data[offsetPrev+1];
					var g1 = data[offset-3], g2 = data[offset+5], g3 = data[offsetNext+1];
					if (g1 < minG) minG = g1;
					if (g2 < minG) minG = g2;
					if (g3 < minG) minG = g3;
					if (g1 > maxG) maxG = g1;
					if (g2 > maxG) maxG = g2;
					if (g3 > maxG) maxG = g3;

					minB = maxB = data[offsetPrev+2];
					var b1 = data[offset-2], b2 = data[offset+6], b3 = data[offsetNext+2];
					if (b1 < minB) minB = b1;
					if (b2 < minB) minB = b2;
					if (b3 < minB) minB = b3;
					if (b1 > maxB) maxB = b1;
					if (b2 > maxB) maxB = b2;
					if (b3 > maxB) maxB = b3;

					if (data[offset] > maxR) {
						data[offset] = maxR;
					} else if (data[offset] < minR) {
						data[offset] = minR;
					}
					if (data[offset+1] > maxG) {
						data[offset+1] = maxG;
					} else if (data[offset+1] < minG) {
						data[offset+1] = minG;
					}
					if (data[offset+2] > maxB) {
						data[offset+2] = maxB;
					} else if (data[offset+2] < minB) {
						data[offset+2] = minB;
					}

				} while (--x);
			} while (--y);

			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}/*
 * Pixastic Lib - Sepia filter - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.sepia = {

	process : function(params) {
		var mode = (parseInt(params.options.mode,10)||0);
		if (mode < 0) mode = 0;
		if (mode > 1) mode = 1;

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;
			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;
				var x = w;
				do {
					var offset = offsetY + (x-1)*4;

					if (mode) {
						// a bit faster, but not as good
						var d = data[offset] * 0.299 + data[offset+1] * 0.587 + data[offset+2] * 0.114;
						var r = (d + 39);
						var g = (d + 14);
						var b = (d - 36);
					} else {
						// Microsoft
						var or = data[offset];
						var og = data[offset+1];
						var ob = data[offset+2];

						var r = (or * 0.393 + og * 0.769 + ob * 0.189);
						var g = (or * 0.349 + og * 0.686 + ob * 0.168);
						var b = (or * 0.272 + og * 0.534 + ob * 0.131);
					}

					if (r < 0) r = 0; if (r > 255) r = 255;
					if (g < 0) g = 0; if (g > 255) g = 255;
					if (b < 0) b = 0; if (b > 255) b = 255;

					data[offset] = r;
					data[offset+1] = g;
					data[offset+2] = b;

				} while (--x);
			} while (--y);
			return true;
		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}/*
 * Pixastic Lib - Sharpen filter - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.sharpen = {
	process : function(params) {

		var strength = 0;
		if (typeof params.options.amount != "undefined")
			strength = parseFloat(params.options.amount)||0;

		if (strength < 0) strength = 0;
		if (strength > 1) strength = 1;

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var dataCopy = Pixastic.prepareData(params, true)

			var mul = 15;
			var mulOther = 1 + 3*strength;

			var kernel = [
				[0, 	-mulOther, 	0],
				[-mulOther, 	mul, 	-mulOther],
				[0, 	-mulOther, 	0]
			];

			var weight = 0;
			for (var i=0;i<3;i++) {
				for (var j=0;j<3;j++) {
					weight += kernel[i][j];
				}
			}

			weight = 1 / weight;

			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;

			mul *= weight;
			mulOther *= weight;

			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;

				var nextY = (y == h) ? y - 1 : y;
				var prevY = (y == 1) ? 0 : y-2;

				var offsetYPrev = prevY*w4;
				var offsetYNext = nextY*w4;

				var x = w;
				do {
					var offset = offsetY + (x*4-4);

					var offsetPrev = offsetYPrev + ((x == 1) ? 0 : x-2) * 4;
					var offsetNext = offsetYNext + ((x == w) ? x-1 : x) * 4;

					var r = ((
						- dataCopy[offsetPrev]
						- dataCopy[offset-4]
						- dataCopy[offset+4]
						- dataCopy[offsetNext])		* mulOther
						+ dataCopy[offset] 	* mul
						);

					var g = ((
						- dataCopy[offsetPrev+1]
						- dataCopy[offset-3]
						- dataCopy[offset+5]
						- dataCopy[offsetNext+1])	* mulOther
						+ dataCopy[offset+1] 	* mul
						);

					var b = ((
						- dataCopy[offsetPrev+2]
						- dataCopy[offset-2]
						- dataCopy[offset+6]
						- dataCopy[offsetNext+2])	* mulOther
						+ dataCopy[offset+2] 	* mul
						);


					if (r < 0 ) r = 0;
					if (g < 0 ) g = 0;
					if (b < 0 ) b = 0;
					if (r > 255 ) r = 255;
					if (g > 255 ) g = 255;
					if (b > 255 ) b = 255;

					data[offset] = r;
					data[offset+1] = g;
					data[offset+2] = b;

				} while (--x);
			} while (--y);

			return true;

		}
	},
	checkSupport : function() {
		return Pixastic.Client.hasCanvasImageData();
	}
}
/*
 * Pixastic Lib - Solarize filter - v0.1.0
 * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
 * License: [http://www.pixastic.com/lib/license.txt]
 */

Pixastic.Actions.solarize = {

	process : function(params) {
		var useAverage = !!(params.options.average && params.options.average != "false");

		if (Pixastic.Client.hasCanvasImageData()) {
			var data = Pixastic.prepareData(params);
			var rect = params.options.rect;
			var w = rect.width;
			var h = rect.height;
			var w4 = w*4;
			var y = h;
			do {
				var offsetY = (y-1)*w4;
				var x = w;
				do {
					var offset = offsetY + (x-1)*4;

					var r = data[offset];
					var g = data[offset+1];
					var b = data[offset+2];

					if (r > 127) r = 255 - r;
					if (g > 127) g = 255 - g;
					if (b > 127) b = 255 - b;

					data[offset] = r;
					data[offset+1] = g;
					data[offset+2] = b;

				} while (--x);
			} while (--y);
			return true;
		}
	},
	checkSupport : function() {
		return (Pixastic.Client.hasCanvasImageData());
	}
};
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-dependencies/pixastic.custom.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/ajax.js
var ajax = function(args) {
    var url = args.url;
    if (args.data && args.method !== 'POST' || args.queryString) {
        url += '?' + ajax.prepare(args.data);
        args.data = undefined;
    } else if (typeof args.data !== 'undefined') {
        args.data = ajax.prepare(args.data);
    }
    ajax.send(url, args.success, args.method || 'GET', args.data, args.async, args.headers || {})
};

ajax.prepare = function(data) {
    var query = [];
    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }
    return query.join('&');
};

ajax.send = function(url, callback, method, data, async, headers) {
    var x = new XMLHttpRequest();
    x.open(method, url, async);
    x.onreadystatechange = function() {
        if (x.readyState == 4) {
            callback(x.responseText, x)
        }
    };
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (method == 'POST') {
        x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    }
    for (var header in headers) {
        x.setRequestHeader(header, headers[header]);
    }
    x.send(data)
};

ajax.get = function(url, data, successCallback, async, headers, method) {
    ajax({
        url: url,
        data: data,
        success: successCallback,
        async: async,
        headers: headers,
        method: method || 'GET'
    });
};

ajax.post = function(url, data, successCallback, async, headers, method) {
    ajax({
        url: url,
        data: data,
        success: successCallback,
        async: async,
        headers: headers,
        method: method || 'POST'
    });
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/ajax.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/debug.js
// <debug>
/**
 * Minimum debugging level (only available in dev and debug build)
 * @type int
 * @constant
 */
var MIN = 100;
/**
 * Medium debugging level (only available in dev and debug build)
 * @type int
 * @constant
 */
var MID = 500;
/**
 * Maximum debugging level (only available in development and debug build)
 * @type int
 * @constant
 */
var MAX = 1000;
/**
 * Current debugging level
 * @type int
 */
var debugLevel = typeof(window.debugLevel) !== 'undefined' ? window.debugLevel : MIN;


/**
 * Output a informational message, by default to the JS console (only avalible in development and debug build).
 *
 * @param {String} message1
 * @param {String} [message2...]
 */
function info() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[Raptor]: ');
    (console.info || console.log).apply(console, args);
}

/**
 * Output a debug message, by default to the JS console (only avalible in development and debug build).
 *
 * @param {String} message1
 * @param {String} [message2...]
 */
function debug() {
    var args = Array.prototype.slice.call(arguments);
    if (console && console.debug && console.debug.apply) {
        args.unshift('[Raptor]: ');
        console.debug.apply(console, args);
    } else if (console && console.log && console.log.apply) {
        args.unshift('[Raptor]: ');
        console.log.apply(console, args);
    } else if (console && console.log) {
        args.unshift('[Raptor]');
        console.log(args);
    }
}

var abortLoopCount = null;
function abortLoop(i) {
    if (abortLoopCount === null) {
        abortLoopCount = i;
    }
    if (abortLoopCount <= 0) {
        throw new Error('Aborting loop');
    }
    abortLoopCount--;
}
// </debug>


// <strict>

/**
 * Handles an error message by either displaying it in the JS console, or throwing
 * and exception (only avalible in development and strict build).
 * @static
 * @param {String} errorMessage The error message to display or throw
 */
function handleError(errorMessage) {
    var args = Array.prototype.slice.call(arguments);
    if (console && console.error && console.error.apply) {
        args.unshift('[Raptor][Error]: ');
        console.error.apply(console, args);
        if (args[1] && args[1].stack) {
            console.error.apply(console, [args[1].stack]);
        }
    } else if (console && console.log && console.log.apply) {
        args.unshift('[Raptor][Error]: ');
        console.log.apply(console, args);
        if (args[1] && args[1].stack) {
            console.log.apply(console, [args[1].stack]);
        }
    } else if (console && console.log) {
        args.unshift('[Raptor][Error]');
        console.log(args);
        if (args[1] && args[1].stack) {
            console.log(args[1].stack);
        }
    } else {
        throw errorMessage;
    }
}

function handleInvalidArgumentError(errorMessage, argument) {
    handleError(errorMessage + ', got: ', argument, typeof argument);
}
// </strict>
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/debug.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/event.js
function eventMouseEnter(node, callback) {
    node.addEventListener('mouseover', function(event) {
        if (!event.relatedTarget || (event.relatedTarget !== this && !(this.compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY))) {
            callback.call(node, event);
        }
    });
};

function eventMouseLeave(node, callback) {
    node.addEventListener('mouseout', function(event) {
        if (!event.relatedTarget || (event.relatedTarget !== this && !(this.compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY))) {
            callback.call(node, event);
        }
    });
};

function eventEventable(object) {
    object.prototype.events = {};
    object.prototype.bindOptions = function(options) {
        for (var name in options) {
            this.bind(name, options[name]);
        }
    };
    object.prototype.bind = function(name, callback) {
        // <strict>
        if (typeof callback === 'undefined' ||
                !$.isFunction(callback)) {
            handleError('Must bind a valid callback, ' + name + ' was a ' + typeof callback);
            return;
        }
        // </strict>
        var names = name.split(/,\s*/);
        for (var i = 0, l = names.length; i < l; i++) {
            if (!this.events[names[i]]) {
                this.events[names[i]] = [];
            }
            this.events[names[i]].push(callback);
        }
    };
    object.prototype.fire = function(name, args) {
        var result = [];

        // <debug>
        if (debugLevel === MAX) {
            debug('Firing event: ' + name);
        }
        // </debug>

        if (this.events[name]) {
            for (var i = 0; i < this.events[name].length; i++) {
                var event = this.events[name][i],
                    currentResult = event.apply(this, args);
                if (typeof currentResult !== 'undefined') {
                    result = result.concat(currentResult);
                }
            }
        }

        return result;
    };
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/event.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/format.js
function formatBytes(bytes, decimalPlaces) {
    if (typeof decimalPlaces === 'undefined') {
        decimalPlaces = 2;
    }
    var suffix = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    for (var i = 0; bytes > 1024 && i < 8; i++) {
        bytes /= 1024;
    }
    return Math.round(bytes, decimalPlaces) + ' ' + suffix[i];
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/format.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/i18n.js
/**
 * @fileOverview Editor internationalization (i18n) private functions and properties.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 */

/**
 * @type String|null
 */
var currentLocale = null;

var localeFallback = 'en';

/**
 * @type Object
 */
var locales = {};

/**
 * @type Object
 */
var localeNames = {};

/**
 *
 * @static
 * @param {String} languageCode The language code (e.g. `en`, `fr`, `zh-CN`).
 * @param {String} nativeName The languages native name.
 * @param {Object} [strings] Locale keys mapped to phrases.
 */
function registerLocale(name, nativeName, strings) {
    // <strict>
    if (locales[name]) {
        handleError('Locale ' + name + ' has already been registered, and will be overwritten.');
    }
    // </strict>
    // <debug>
    if (debugLevel > MIN) {
        debug('Locale ' + name + ' registered.');
    }
    // </debug>

    locales[name] = strings;
    localeNames[name] = nativeName;
}

/**
 * Extends an existing locale, or registers it if it does not already exist.
 *
 * @static
 * @param {String} languageCode The language code (e.g. `en`, `fr`, `zh-CN`).
 * @param {String|Object} nativeName The languages native name, or an locale keys mapped to phrases.
 * @param {Object} [strings] Locale keys mapped to phrases.
 */
function extendLocale(languageCode, nativeName, strings) {
    if (typeof locales[languageCode] === 'undefined') {
        registerLocale(languageCode, nativeName, strings);
    } else {
        // <debug>
        if (debugLevel > MIN) {
            debug('Locale ' + languageCode + ' extended.');
        }
        // </debug>

        // Allow only passing the nativeName once.
        strings = strings || nativeName;

        for (var key in strings) {
            locales[languageCode][key] = strings[key];
        }
    }
}

/**
 * @param {String} key
 */
function setLocale(key) {
    if (currentLocale !== key) {
        // <debug>
        debug('Changing locale', key);
        // </debug>

        currentLocale = key;
        Raptor.eachInstance(function() {
            this.localeChange();
        });
    }
}

/**
 * Return the localised string for the current locale if present, else the
 * localised string for the first available locale, failing that return the
 * string.
 *
 * @param  {string} string
 * @param  {Boolean} allowMissing If true and the localized string is missing, false is returned.
 * @return {string|false}
 */
function getLocalizedString(string, allowMissing) {
    if (typeof locales[currentLocale] !== 'undefined' &&
            typeof locales[currentLocale][string] !== 'undefined') {
        return locales[currentLocale][string];
    }

    if (typeof locales[localeFallback] !== 'undefined' &&
            typeof locales[localeFallback][string] !== 'undefined') {
        return locales[localeFallback][string];
    }

    for (var localeName in localeNames) {
        if (typeof locales[localeName][string] !== 'undefined') {
            return locales[localeName][string];
        }
    }

    if (allowMissing) {
        return false;
    }

    // <debug>
    if (debugLevel >= MIN) {
        handleError('Missing locale string: ' + string);
    }
    // </debug>
    return string;
}

/**
 * Internationalisation function. Translates a string with tagged variable
 * references to the current locale.
 *
 * <p>
 * Variable references should be surrounded with double curly braces {{ }}
 *      e.g. "This string has a variable: {{my.variable}} which will not be translated"
 * </p>
 *
 * @static
 * @param {String} string
 * @param {Object|false} variables If false, then no string is returned by default.
 */
function tr(string, variables) {
    if (!currentLocale) {
        var lastLocale = Raptor.persist('locale');
        if (lastLocale) {
            currentLocale = lastLocale;
        }
    }
    if (!currentLocale) {
        currentLocale = 'en';
    }

    // Get the current locale translated string
    string = getLocalizedString(string, variables === false);
    if (string === false) {
        return false;
    }

    // Convert the variables
    if (!variables) {
        return string;
    } else {
        for (var key in variables) {
            string = string.replace('{{' + key + '}}', variables[key]);
        }
        return string;
    }
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/i18n.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/node.js

/**
 * Generates a unique ID for a node.
 *
 * @returns {String} The unique ID.
 */
function nodeUniqueId(node) {
    if (!node || !node.id) {
        var id;
        do {
            id = 'ruid-' + Math.random().toString().replace('.', '');
        } while (document.getElementById(id))
        if (!node) {
            return id;
        }
        node.id = id;
    }
    return node.id;
}

function nodeClosestByClassName(node, className) {
    while (node.parentNode && node.parentNode.className != className) {
        node = node.parentNode;
    }
    if (node.parentNode) {
        return node.parentNode;
    }
    return null;
}

function nodeFromHtml(html, wrapper) {
    var node = document.createElement(wrapper || 'div');
    node.innerHTML = html;
    return node.children[0];
}

function nodeClassSwitch(node, classAdd, classRemove) {
    node.classList.add(classAdd);
    node.classList.remove(classRemove);
}

function nodeLastChild(node) {
    var lastChild = node.lastChild
    while (lastChild && lastChild.nodeType !== 1) {
        lastChild = lastChild.previousSibling;
    }
    return lastChild;
}

function nodeOffsetTop(node) {
    var offsetTop = 0;
    do {
        if (node.tagName === 'BODY') {
            break;
        } else {
            offsetTop += node.offsetTop;
        }
        node = node.offsetParent;
    } while(node);
    return offsetTop;
}

function nodeFreezeHeight(node) {
    if (typeof node.dataset.height === 'undefined') {
        node.dataset.height = node.style.height;
        node.style.height = document.body.clientHeight + 'px';
    }
}

function nodeUnfreezeHeight(node) {
    if (typeof node.dataset.height !== 'undefined') {
        node.style.height = node.dataset.height;
        delete node.dataset.height;
    }
}

function nodeMatches(node, selector) {
    var method =
        Element.prototype.matches ||
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector;
    return method.call(node, selector);
}

function nodeFindUnnested(node, findSelector, nestedSelector) {
    var nodes = node.querySelectorAll(findSelector),
        result = [];
    for (var i = 0; i < nodes.length; i++) {
        var closest = nodes[i];
        do {
            if (nodeMatches(closest, nestedSelector)) {
                break;
            }
        } while (closest = closest.parentNode);
        if (closest == node) {
            result.push(nodes[i]);
        }
    }
    return result;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/node.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/persist.js
function persistSet(key, value) {
    // Local storage throws an error when using XUL
    try {
        if (localStorage) {
            var storage;
            if (localStorage.raptor) {
                storage = JSON.parse(localStorage.raptor);
            } else {
                storage = {};
            }
            storage[key] = value;
            localStorage.raptor = JSON.stringify(storage);
            return true;
        }
    } catch (e) {
    }
    return false;
};

function persistGet(key, defaultValue) {
    // Local storage throws an error when using XUL
    try {
        if (localStorage) {
            var storage;
            if (localStorage.raptor) {
                storage = JSON.parse(localStorage.raptor);
            } else {
                storage = {};
            }
            return storage[key];
        }
    } catch (e) {
    }
    return defaultValue;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/persist.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/plugin.js
function Plugin(overrides) {
    for (var key in overrides) {
        this[key] = overrides[key];
    }
};

Plugin.prototype.init = function() {}

function pluginPluggable(object) {
    object.registerPlugin = function(plugin) {
        // <strict>
        if (typeof plugin !== 'object') {
            handleError('Plugin "' + plugin + '" is invalid (must be an object)');
            return;
        } else if (typeof plugin.name !== 'string') {
            handleError('Plugin "'+ plugin + '" is invalid (must have a name property)');
            return;
        } else if (this.prototype.plugins[plugin.name]) {
            handleError('Plugin "' + plugin.name + '" has already been registered, and will be overwritten');
        }
        // </strict>

        this.prototype.plugins[plugin.name] = plugin;
    };
    object.prototype.plugins = {};
    object.prototype.pluginInstances = {};
};

function pluginPrepare(pluggable, plugin, pluginOptions, pluginAttributes) {
    // <strict>
    if (typeof plugin !== 'object') {
        handleError('Plugin "' + plugin + '" is invalid (must be an object)');
        return;
    } else if (typeof plugin.name !== 'string') {
        handleError('Plugin "'+ plugin + '" is invalid (must have a name property)');
        return;
    }
    // </strict>

    var instance = $.extend({}, plugin);

    var options = $.extend({}, pluggable.options, {
        baseClass: 'raptor-plugin-' + stringFromCamelCase(plugin.name)
    }, instance.options, pluginOptions);

    instance.pluggable = pluggable;
    instance.options = options;

    for (var key in pluginAttributes) {
        instance[key] = pluginAttributes[key];
    }

    // <strict>
    if (!instance.init) {
        handleError('Component missing init function: ' + instance.name);
    }
    // </strict>
    var ui = instance.init();

    return {
        ui: ui,
        instance: instance
    };
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/plugin.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/state.js
var stateDirty = {};

jQuery(window).on('beforeunload', stateCheckDirty);

function stateSetDirty(owner, dirty) {
    if (dirty) {
        stateDirty[owner] = dirty;
    } else {
        delete stateDirty[owner];
    }
}

function stateCheckDirty(event) {
    var dirty = false;
    for (var key in stateDirty) {
        if (typeof stateDirty[key] === 'function') {
            if (stateDirty[key]()) {
                dirty = true;
            }
        } else if (stateDirty[key]) {
            dirty = true;
        }
    }
    if (dirty) {
        var confirmationMessage = 'There are unsaved changes on this page. Are you sure you wish to navigate away?';
        (event || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
    }
};
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/state.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/string.js
function stringHash(string) {
    return string
        .split('')
        .reduce(function(a, b){
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a
        }, 0);
}

function stringUcFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function stringFromCamelCase(string, delimiter) {
    return string.replace(/([A-Z])/g, function(match) {
        return (delimiter || '-') + match.toLowerCase();
    });
}

function stringToCamelCase(string, ucFirst) {
    var result = string.toLowerCase().replace(/[^a-z0-9](.)/ig, function(match, char) {
        return char.toUpperCase();
    });
    if (ucFirst !== false) {
        result = stringUcFirst(result);
    }
    return result;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/string.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/template.js
/**
 * @fileOverview Template helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 *
 * @type type
 */
var templateCache = { 
    "unsupported": "<div class=\"raptor-ui {{baseClass}}-unsupported-overlay\"></div> <div class=\"raptor-ui {{baseClass}}-unsupported-content\"> It has been detected that you a using a browser that is not supported by Raptor, please use one of the following browsers: <ul> <li><a href=\"http://www.google.com/chrome\">Google Chrome</a></li> <li><a href=\"http://www.firefox.com\">Mozilla Firefox</a></li> <li><a href=\"http://www.google.com/chromeframe\">Internet Explorer with Chrome Frame</a></li> </ul> <div class=\"{{baseClass}}-unsupported-input\"> <button class=\"{{baseClass}}-unsupported-close\">Close</button> <input name=\"{{baseClass}}-unsupported-show\" type=\"checkbox\" /> <label>Don't show this message again</label> </div> <div>",
    "class-menu.item": "<li><a data-value=\"{{value}}\">{{label}}</a></li>",
    "click-button-to-edit.button": "<button class=\"{{baseClass}}-button\">tr('clickButtonToEditPluginButton')</button>",
    "color-menu-basic.automatic": "<li><a data-color=\"automatic\"><div class=\"{{baseClass}}-swatch\" style=\"display: none\"></div> <span>tr('colorMenuBasicAutomatic')</span></a></li>",
    "color-menu-basic.item": "<li><a data-color=\"{{className}}\"><div class=\"{{baseClass}}-swatch\" style=\"background-color: {{color}}\"></div> <span>{{label}}</span></a></li>",
    "embed.dialog": "<div class=\"{{baseClass}}-panel-tabs ui-tabs ui-widget ui-widget-content ui-corner-all\"> <ul class=\"ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all\"> <li class=\"ui-state-default ui-corner-top ui-tabs-selected ui-state-active\"><a>tr('embedDialogTabCode')</a></li> <li class=\"ui-state-default ui-corner-top\"><a>tr('embedDialogTabPreview')</a></li> </ul> <div class=\"{{baseClass}}-code-tab\"> <p>tr('embedDialogTabCodeContent')</p> <textarea></textarea> </div> <div class=\"{{baseClass}}-preview-tab\" style=\"display: none\"> <p>tr('embedDialogTabPreviewContent')</p> <div class=\"{{baseClass}}-preview\"></div> </div> </div>",
    "font-family.menu-item": "<li><a data-font=\"{{fontName}}\"><span>{{fontTitle}}</span></a></li>",
    "image-resize.dialog": "<div class=\"raptor-resize-image\"> <div> <label for=\"{{baseClass}}-width\">tr('imageResizeDialogWidth')</label> <input class=\"form-text\" id=\"{{baseClass}}-width\" name=\"width\" type=\"text\" placeholder=\"tr('imageResizeDialogWidthPlaceHolder')\"/> </div> <div> <label for=\"{{baseClass}}-height\">tr('imageResizeDialogHeight')</label> <input class=\"form-text\" id=\"{{baseClass}}-height\" name=\"height\" type=\"text\" placeholder=\"tr('imageResizeDialogHeightPlaceHolder')\"/> </div> <div class=\"{{baseClass}}-lock-proportions-container\"> <span class=\"{{baseClass}}-lock-proportions\"> <span class=\"ui-button-text\">Constrain proportions</span> <span class=\"ui-icon ui-icon-locked\"></span> </span> </div> </div>",
    "insert-file.dialog": "<div> <div> <label class=\"form-label\">tr('insertFileURLLabel')</label> <input type=\"text\" name=\"location\" class=\"form-text\" placeholder=\"tr('insertFileURLPlaceHolder')\"/> </div> <div> <label class=\"form-label\">tr('insertFileNameLabel')</label> <input type=\"text\" name=\"name\" class=\"form-text\" placeholder=\"tr('insertFileNamePlaceHolder')\"/> </div> </div>",
    "language-menu.item": "<li><a data-value=\"{{value}}\"><span class=\"ui-icon ui-icon-flag-{{icon}}\"></span>{{label}}</a></li>",
    "link.dialog": "<div style=\"display:none\" class=\"{{baseClass}}-panel\"> <div class=\"{{baseClass}}-menu\"> <p>tr('linkCreateDialogMenuHeader')</p> <fieldset data-menu=\"\"></fieldset> </div> <div class=\"{{baseClass}}-wrap\"> <div class=\"{{baseClass}}-content\" data-content=\"\"></div> </div> </div>",
    "link.document": "<h2>tr('linkTypeDocumentHeader')</h2> <fieldset> <label for=\"{{baseClass}}-document-href\">tr('linkTypeDocumentLocationLabel')</label> <input id=\"{{baseClass}}-document-href\" value=\"http://\" name=\"location\" class=\"{{baseClass}}-document-href\" type=\"text\" placeholder=\"tr('linkTypeDocumentLocationPlaceHolder')\" /> </fieldset> <h2>tr('linkTypeDocumentNewWindowHeader')</h2> <fieldset> <label for=\"{{baseClass}}-document-target\"> <input id=\"{{baseClass}}-document-target\" name=\"blank\" type=\"checkbox\" /> <span>tr('linkTypeDocumentNewWindowLabel')</span> </label> </fieldset> tr('linkTypeDocumentInfo')",
    "link.email": "<h2>tr('linkTypeEmailHeader')</h2> <fieldset class=\"{{baseClass}}-email\"> <label for=\"{{baseClass}}-email\">tr('linkTypeEmailToLabel')</label> <input id=\"{{baseClass}}-email\" name=\"email\" type=\"text\" placeholder=\"tr('linkTypeEmailToPlaceHolder')\"/> </fieldset> <fieldset class=\"{{baseClass}}-email\"> <label for=\"{{baseClass}}-email-subject\">tr('linkTypeEmailSubjectLabel')</label> <input id=\"{{baseClass}}-email-subject\" name=\"subject\" type=\"text\" placeholder=\"tr('linkTypeEmailSubjectPlaceHolder')\"/> </fieldset>",
    "link.error": "<div style=\"display:none\" class=\"ui-widget {{baseClass}}-error-message {{messageClass}}\"> <div class=\"ui-state-error ui-corner-all\"> <p> <span class=\"ui-icon ui-icon-alert\"></span> {{message}} </p> </div> </div>",
    "link.external": "<h2>tr('linkTypeExternalHeader')</h2> <fieldset> <label for=\"{{baseClass}}-external-href\">tr('linkTypeExternalLocationLabel')</label> <input id=\"{{baseClass}}-external-href\" value=\"http://\" name=\"location\" class=\"{{baseClass}}-external-href\" type=\"text\" placeholder=\"tr('linkTypeExternalLocationPlaceHolder')\" /> </fieldset> <h2>tr('linkTypeExternalNewWindowHeader')</h2> <fieldset> <label for=\"{{baseClass}}-external-target\"> <input id=\"{{baseClass}}-external-target\" name=\"blank\" type=\"checkbox\" checked=\"checked\" /> <span>tr('linkTypeExternalNewWindowLabel')</span> </label> </fieldset> tr('linkTypeExternalInfo')",
    "link.file-url": "<h2>tr('Link to a document or other file')</h2> <fieldset> <label for=\"{{baseClass}}-external-href\">tr('Location')</label> <input id=\"{{baseClass}}-external-href\" value=\"http://\" name=\"location\" class=\"{{baseClass}}-external-href\" type=\"text\" placeholder=\"tr('Enter your URL')\" /> </fieldset> <h2>tr('New window')</h2> <fieldset> <label for=\"{{baseClass}}-external-target\"> <input id=\"{{baseClass}}-external-target\" name=\"blank\" type=\"checkbox\" /> <span>tr('Check this box to have the file open in a new browser window')</span> </label> </fieldset> <h2>tr('Not sure what to put in the box above?')</h2> <ol> <li>tr('Ensure the file has been uploaded to your website')</li> <li>tr('Open the uploaded file in your browser')</li> <li>tr(\"Copy the file's URL from your browser's address bar and paste it into the box above\")</li> </ol>",
    "link.internal": "<h2>tr('linkTypeInternalHeader')</h2> <fieldset> <label for=\"{{baseClass}}-internal-href\">tr('linkTypeInternalLocationLabel') {{domain}}</label> <input id=\"{{baseClass}}-internal-href\" value=\"\" name=\"location\" class=\"{{baseClass}}-internal-href\" type=\"text\" placeholder=\"tr('linkTypeInternalLocationPlaceHolder')\" /> </fieldset> <h2>tr('linkTypeInternalNewWindowHeader')</h2> <fieldset> <label for=\"{{baseClass}}-internal-target\"> <input id=\"{{baseClass}}-internal-target\" name=\"blank\" type=\"checkbox\" /> <span>tr('linkTypeInternalNewWindowLabel')</span> </label> </fieldset> tr('linkTypeInternalInfo')",
    "link.label": "<label> <input type=\"radio\" name=\"link-type\" autocomplete=\"off\"/> <span>{{label}}</span> </label>",
    "paste.dialog": "<div class=\"{{baseClass}}-panel ui-dialog-content ui-widget-content\"> <div class=\"{{baseClass}}-panel-tabs ui-tabs ui-widget ui-widget-content ui-corner-all\"> <ul class=\"ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all\"> <li class=\"{{baseClass}}-tab-formatted-clean ui-state-default ui-corner-top ui-state-active ui-tabs-selected\" style=\"display: none\"><a>tr('pasteDialogFormattedCleaned')</a></li> <li class=\"{{baseClass}}-tab-plain-text ui-state-default ui-corner-top\" style=\"display: none\"><a>tr('pasteDialogPlain')</a></li> <li class=\"{{baseClass}}-tab-formatted-unclean ui-state-default ui-corner-top\" style=\"display: none\"><a>tr('pasteDialogFormattedUnclean')</a></li> <li class=\"{{baseClass}}-tab-source ui-state-default ui-corner-top\" style=\"display: none\"><a>tr('pasteDialogSource')</a></li> </ul> <div class=\"{{baseClass}}-tab {{baseClass}}-content-formatted-clean\" style=\"display: none\"> <div contenteditable=\"true\" class=\"{{baseClass}}-area {{baseClass}}-markup\"></div> </div> <div class=\"{{baseClass}}-tab {{baseClass}}-content-plain-text\" style=\"display: none\"> <div contenteditable=\"true\" class=\"{{baseClass}}-area {{baseClass}}-plain\"></div> </div> <div class=\"{{baseClass}}-tab {{baseClass}}-content-formatted-unclean\" style=\"display: none\"> <div contenteditable=\"true\" class=\"{{baseClass}}-area {{baseClass}}-rich\"></div> </div> <div class=\"{{baseClass}}-tab {{baseClass}}-content-source\" style=\"display: none\"> <div contenteditable=\"true\" class=\"{{baseClass}}-area {{baseClass}}-source\"></div> </div> </div> </div>",
    "snippet-menu.item": "<li><a data-name=\"{{name}}\">{{name}}</a></li>",
    "special-characters.dialog": "<div> tr('specialCharactersHelp') <br/> <ul></ul> </div>",
    "special-characters.tab-button": "<button data-setKey=\"{{setKey}}\" data-charactersIndex=\"{{charactersIndex}}\" title=\"{{description}}\">{{htmlEntity}}</button>",
    "special-characters.tab-content": "<div id=\"{{baseClass}}-{{key}}\"></div>",
    "special-characters.tab-li": "<li><a href=\"#{{baseClass}}-{{key}}\">{{name}}</a></li>",
    "statistics.dialog": "<div> <ul> <li data-name=\"characters\"></li> <li data-name=\"words\"></li> <li data-name=\"sentences\"></li> <li data-name=\"truncation\"></li> </ul> </div>",
    "table.create-menu": "<table class=\"{{baseClass}}-menu\"> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> <tr> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> </tr> </table>",
    "tag-menu.item": "<li><a data-value=\"{{tag}}\">{{name}}</a></li>",
    "unsaved-edit-warning.warning": "<div class=\"{{baseClass}} ui-corner-tl\"> <span class=\"ui-icon ui-icon-alert\"></span> <span>tr('unsavedEditWarningText')</span> </div>",
    "view-source.dialog": "<div class=\"{{baseClass}}-inner-wrapper\"> <textarea></textarea> </div>"
 };

function templateRegister(name, content) {
    templateCache[name] = content;
}

function templateGet(name) {
    return templateCache[name];
};

/**
 *
 * @param {type} template
 * @param {type} variables
 * @returns {unresolved}
 */
function templateConvertTokens(template, variables) {
    // Translate template
    template = template.replace(/tr\(['"]{1}(.*?)['"]{1}\)/g, function(match, key) {
        key = key.replace(/\\(.?)/g, function (s, slash) {
            switch (slash) {
                case '\\': {
                    return '\\';
                }
                case '0': {
                    return '\u0000';
                }
                case '': {
                    return '';
                }
                default: {
                    return slash;
                }
            }
        });
        return tr(key);
    });

    // Replace variables
    variables = $.extend({}, this.options, variables || {});
    variables = templateGetVariables(variables);
    template = template.replace(/\{\{(.*?)\}\}/g, function(match, variable) {
        // <debug>
        if (typeof variables[variable] === 'undefined') {
            handleError(new Error('Missing template variable: ' + variable));
        }
        // </debug>
        return variables[variable];
    });

    return template;
};

/**
 *
 * @param {type} variables
 * @param {type} prefix
 * @param {type} depth
 * @returns {unresolved}
 */
function templateGetVariables(variables, prefix, depth) {
    prefix = prefix ? prefix + '.' : '';
    var maxDepth = 5;
    if (!depth) depth = 1;
    var result = {};
    for (var name in variables) {
        if (typeof variables[name] === 'object' && depth < maxDepth) {
            var inner = templateGetVariables(variables[name], prefix + name, ++depth);
            for (var innerName in inner) {
                result[innerName] = inner[innerName];
            }
        } else {
            result[prefix + name] = variables[name];
        }
    }
    return result;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/template.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/toolbar.js
function toolbarLayout(pluggable, uiOrder, panelElement, pluginAttributes) {
    panelElement = $(panelElement || document.createElement('div'));
    // Loop the UI component order option
    for (var i = 0, l = uiOrder.length; i < l; i++) {
        var uiGroupContainer = $('<div/>')
            .addClass('raptor-layout-toolbar-group');

        // Loop each UI in the group
        var uiGroup = uiOrder[i];
        for (var ii = 0, ll = uiGroup.length; ii < ll; ii++) {
            // Check the UI has been registered
            if (!pluggable.plugins[uiGroup[ii]]) {
                // <strict>
                debug('Plugin identified by key "' + uiGroup[ii] + '" does not exist');
                // </strict>
                continue;
            }

            var pluginOptions = pluggable.plugins[uiGroup[ii]];
            if (pluginOptions === false) {
                continue;
            }

            var component = pluginPrepare(pluggable, pluggable.plugins[uiGroup[ii]], pluginOptions, pluginAttributes);

            pluggable.pluginInstances[uiGroup[ii]] = component.instance;

            if (typeIsElement(component.ui)) {
                // Fix corner classes
                component.ui.removeClass('ui-corner-all');

                // Append the UI object to the group
                uiGroupContainer.append(component.ui);
            }
        }

        // Append the UI group to the editor toolbar
        if (uiGroupContainer.children().length > 0) {
            uiGroupContainer.appendTo(panelElement);
        }
    }

    // Fix corner classes
    panelElement.find('.ui-button:first-child').addClass('ui-corner-left');
    panelElement.find('.ui-button:last-child').addClass('ui-corner-right');
    return panelElement[0];
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/toolbar.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/types.js
/**
 * @fileOverview Type checking functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author Michael Robinson michael@panmedia.co.nz
 * @author David Neilsen david@panmedia.co.nz
 */

/**
 * Determine whether object is a number
 * {@link http://stackoverflow.com/a/1421988/187954}.
 *
 * @param  {mixed} object The object to be tested
 * @return {Boolean} True if the object is a number.
 */
function typeIsNumber(object) {
    return !isNaN(object - 0) && object !== null;
}

/**
 * Determines whether object is a string.
 *
 * @param {mixed} object The object to be tested.
 * @returns {Boolean} True if the object is a string.
 */
function typeIsString(object) {
    return typeof object === 'string';
}

/**
 * @param  {mixed} object
 * @return {boolean} True if object is an Array.
 */
function typeIsArray(object) {
    return object instanceof Array;
}

/**
 * Determines whether object is a node.
 *
 * @param {mixed} object The object to be tested.
 * @returns {Boolean} True if the object is a node.
 */
function typeIsNode(object) {
    return object instanceof Node;
}

/**
 * @param  {mixed} object
 * @return {boolean} True if object is a text node.
 */
function typeIsTextNode(object) {
    if (typeIsNode(object)) {
        return object.nodeType === Node.TEXT_NODE;
    }

    if (typeIsElement(object)) {
        return typeIsNode(object[0]);
    }

    return false;
}

/**
 * Determines whether object is a jQuery element.
 *
 * @param {mixed} object The object to be tested.
 * @returns {Boolean} True if the object is a jQUery element.
 */
function typeIsElement(object) {
    return object instanceof jQuery;
}

function typeIsJQueryCompatible(object) {
    return object instanceof Node || object instanceof NodeList || object instanceof HTMLCollection || object instanceof jQuery;
};
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/types.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-locales/en.js
/**
 * @fileOverview English strings file.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 */
extendLocale('en', 'English', {
    alignCenterTitle: 'Align text center',
    alignJustifyTitle: 'Align text justify',
    alignLeftTitle: 'Align text left',
    alignRightTitle: 'Align text right',

    cancelDialogCancelButton: 'Continue Editing',
    cancelDialogContent: 'Are you sure you want to cancel editing? All changes will be lost!',
    cancelDialogOKButton: 'Cancel Editing',
    cancelDialogTitle: 'Cancel Editing',
    cancelTitle: 'Cancel editing',

    classMenuTitle: 'Style picker',
    cleanBlockTitle: 'Clean block',
    clearFormattingTitle: 'Clear formatting',
    clickButtonToEditText: 'Edit',
    clickButtonToEditTitle: null,

    closeTitle: 'Close this toolbar',

    colorMenuBasicAutomatic: 'Automatic',
    colorMenuBasicBlack: 'Black',
    colorMenuBasicBlue: 'Blue',
    colorMenuBasicGreen: 'Green',
    colorMenuBasicGrey: 'Grey',
    colorMenuBasicOrange: 'Orange',
    colorMenuBasicPurple: 'Purple',
    colorMenuBasicRed: 'Red',
    colorMenuBasicTitle: 'Change text color',
    colorMenuBasicWhite: 'White',

    dockToElementTitle: 'Dock/undock editor to element',
    dockToScreenTitle: 'Dock/undock editor to screen',

    embedTitle: 'Embed object',
    embedDialogTitle: 'Embed Object',
    embedDialogTabCode: 'Embed Code',
    embedDialogTabCodeContent: 'Paste your embed code into the text area below:',
    embedDialogTabPreview: 'Preview',
    embedDialogTabPreviewContent: 'A preview of your embedded object is displayed below:',
    embedDialogOKButton: 'Embed Object',
    embedDialogCancelButton: 'Cancel',

    errorUINoName: 'UI "{{ui}}" is invalid (must have a name property)',
    errorUINotObject: 'UI "{{ui}}" is invalid (must be an object)',
    errorUIOverride: 'UI "{{name}}" has already been registered, and will be overwritten',

    editPageDialogTitle: 'Edit Page',
    editPageDialogOKButton: 'Save',
    editPageDialogCancelButton: 'Cancel',

    floatLeftTitle: 'Align image to the left',
    floatNoneTitle: 'Remove image align',
    floatRightTitle: 'Align image to the right',

    fontFamilyMenuTitle: 'Choose your font',
    fontFamilyMenuFontDefault: 'Default Font',
    fontFamilyMenuFontArial: 'Arial',
    fontFamilyMenuFontPalatino: 'Palatino',
    fontFamilyMenuFontGeorgia: 'Georgia',
    fontFamilyMenuFontTimes: 'Times New Roman',
    fontFamilyMenuFontComicSans: 'Comic Sans',
    fontFamilyMenuFontImpact: 'Impact',
    fontFamilyMenuFontCourier: 'Courier New',

    guidesTitle: 'Show element guides',

    historyRedoTitle: 'Redo',
    historyUndoTitle: 'Undo',

    hrCreateTitle: 'Insert Horizontal Rule',

    imageResizeDialogWidth: 'Image width',
    imageResizeDialogHeight: 'Image height',
    imageResizeDialogWidthPlaceHolder: 'Width',
    imageResizeDialogHeightPlaceHolder: 'Height',
    imageResizeDialogTitle: 'Resize Image',
    imageResizeDialogOKButton: 'Resize',
    imageResizeDialogCancelButton: 'Cancel',
    imageResizeTitle: 'Resize this image',

    insertFileTitle: 'Insert file',
    insertFileDialogTitle: 'Insert file',
    insertFileDialogOKButton: 'Insert file',
    insertFileDialogCancelButton: 'Cancel',
    insertFileURLLabel: 'File URL',
    insertFileNameLabel: 'File Name',
    insertFileURLPlaceHolder: 'File URL...',
    insertFileNamePlaceHolder: 'File Name...',

    languageMenuTitle: 'Change Language',

    loremIpsumTitle: 'Insert dummy text for testing',

    listOrderedTitle: 'Ordered list',
    listUnorderedTitle: 'Unordered list',

    linkCreateTitle: 'Insert Link',
    linkRemoveTitle: 'Remove Link',

    linkCreateDialogTitle: 'Insert Link',
    linkCreateDialogOKButton: 'Insert Link',
    linkCreateDialogCancelButton: 'Cancel',
    linkCreateDialogMenuHeader: 'Choose a link type',

    linkTypeEmailLabel: 'Email address',
    linkTypeEmailHeader: 'Link to an email address',
    linkTypeEmailToLabel: 'Email:',
    linkTypeEmailToPlaceHolder: 'Enter email address',
    linkTypeEmailSubjectLabel: 'Subject (optional):',
    linkTypeEmailSubjectPlaceHolder: 'Enter subject',

    linkTypeExternalLabel: 'Page on another website',
    linkTypeExternalHeader: 'Link to a page on another website',
    linkTypeExternalLocationLabel: 'Location:',
    linkTypeExternalLocationPlaceHolder: 'Enter a URL',
    linkTypeExternalNewWindowHeader: 'New window',
    linkTypeExternalNewWindowLabel: 'Check this box to have the link open in a new browser window/tab.',
    linkTypeExternalInfo:
        '<h2>Not sure what to put in the box above?</h2>' +
        '<ol>' +
        '    <li>Find the page on the web you want to link to.</li>' +
        '    <li>Copy the web address from your browser\'s address bar and paste it into the box above.</li>' +
        '</ol>',

    linkTypeDocumentLabel: 'Document or other file',
    linkTypeDocumentHeader: 'Link to a document or other file',
    linkTypeDocumentLocationLabel: 'Location:',
    linkTypeDocumentLocationPlaceHolder: 'Enter a URL',
    linkTypeDocumentNewWindowHeader: 'New window',
    linkTypeDocumentNewWindowLabel: 'Check this box to have the file open in a new browser window/tab.',
    linkTypeDocumentInfo:
        '<h2>Not sure what to put in the box above?</h2>' +
        '<ol>' +
        '    <li>Ensure the file has been uploaded to your website.</li>' +
        '    <li>Open the uploaded file in your browser.</li>' +
        '    <li>Copy the file\'s URL from your browser\'s address bar and paste it into the box above.</li>' +
        '</ol>',

    linkTypeInternalLabel: 'Page on this website',
    linkTypeInternalHeader: 'Link to a page on this website',
    linkTypeInternalLocationLabel: '',
    linkTypeInternalLocationPlaceHolder: 'Enter a URI',
    linkTypeInternalNewWindowHeader: 'New window',
    linkTypeInternalNewWindowLabel: 'Check this box to have the link open in a new browser window/tab.',
    linkTypeInternalInfo:
        '<h2>Not sure what to put in the box above?</h2>' +
        '<ol>' +
        '    <li>Find the page on this site link to.</li>' +
        '    <li>Copy the web address from your browser\'s address bar, excluding "{{domain}}" and paste it into the box above.</li>' +
        '</ol>',

    logoTitle: 'Learn More About the Raptor WYSIWYG Editor',

    navigateAway: '\nThere are unsaved changes on this page. \nIf you navigate away from this page you will lose your unsaved changes',

    pasteDialogTitle: 'Paste',
    pasteDialogOKButton: 'Insert',
    pasteDialogCancelButton: 'Cancel',
    pasteDialogPlain: 'Plain Text',
    pasteDialogFormattedCleaned: 'Formatted &amp; Cleaned',
    pasteDialogFormattedUnclean: 'Formatted Unclean',
    pasteDialogSource: 'Source Code',

    placeholderPluginDefaultContent: '<br/>',

    saveTitle: 'Save content',
    saveNotConfigured: 'Save has not been configured, or is disabled.',
    saveJsonFail: 'Failed to save {{failed}} content block(s)',
    saveJsonSaved: 'Successfully saved {{saved}} content block(s).',
    saveRestFail: 'Failed to save {{failed}} content block(s).',
    saveRestPartial: 'Saved {{saved}} out of {{failed}} content blocks.',
    saveRestSaved: 'Successfully saved {{saved}} content block(s).',

    snippetMenuTitle: 'Snippets',

    specialCharactersArrows: 'Arrows',
    specialCharactersDialogOKButton: 'OK',
    specialCharactersDialogTitle: 'Insert Special Characters',
    specialCharactersGreekAlphabet: 'Greek Alphabet',
    specialCharactersHelp: 'Click a special character to add it. Click "OK" when done to close this dialog',
    specialCharactersMathematics: 'Mathematics',
    specialCharactersSymbols: 'Symbols',
    specialCharactersTitle: 'Insert a special character',

    statisticsButtonCharacterOverLimit: '{{charactersRemaining}} characters over limit',
    statisticsButtonCharacterRemaining: '{{charactersRemaining}} characters remaining',
    statisticsButtonCharacters: '{{characters}} characters',
    statisticsDialogCharactersOverLimit: '{{characters}} characters, {{charactersRemaining}} over the recommended limit',
    statisticsDialogCharactersRemaining: '{{characters}} characters, {{charactersRemaining}} remaining',
    statisticsDialogNotTruncated: 'Content will not be truncated',
    statisticsDialogOKButton: 'Ok',
    statisticsDialogSentence: '{{sentences}} sentence',
    statisticsDialogSentences: '{{sentences}} sentences',
    statisticsDialogTitle: 'Content Statistics',
    statisticsDialogTruncated: 'Content contains more than {{limit}} characters and may be truncated',
    statisticsDialogWord: '{{words}} word',
    statisticsDialogWords: '{{words}} words',
    statisticsTitle: 'Click to view statistics',

    imageSwapTitle: 'Swap this image',

    tableCreateTitle: 'Create table',
    tableDeleteColumnTitle: 'Delete table column',
    tableDeleteRowTitle: 'Delete table row',
    tableInsertColumnTitle: 'Insert table column',
    tableInsertRowTitle: 'Insert table row',
    tableMergeCellsTitle: 'Merge table cells',
    tableSplitCellsTitle: 'Split table cells',

    tagMenuTagH1: 'Heading&nbsp;1',
    tagMenuTagH2: 'Heading&nbsp;2',
    tagMenuTagH3: 'Heading&nbsp;3',
    tagMenuTagH4: 'Heading&nbsp;4',
    tagMenuTagNA: 'N/A',
    tagMenuTagP: 'Paragraph',
    tagMenuTagDiv: 'Div',
    tagMenuTagPre: 'Pre-formatted',
    tagMenuTagAddress: 'Address',
    tagMenuTitle: 'Change element style',

    tagTreeElementLink: 'Select {{element}} element',
    tagTreeElementTitle: 'Click to select the contents of the "{{element}}" element',
    tagTreeRoot: 'root',
    tagTreeRootLink: 'Select all editable content',
    tagTreeRootTitle: 'Click to select all editable content',

    textBlockQuoteTitle: 'Block quote',
    textBoldTitle: 'Bold',
    textItalicTitle: 'Italic',
    textStrikeTitle: 'Strike through',
    textSubTitle: 'Sub-script',
    textSuperTitle: 'Super-script',
    textUnderlineTitle: 'Underline',
    textSizeDecreaseTitle: 'Decrease text size',
    textSizeIncreaseTitle: 'Increase text size',

    unsavedEditWarningText: 'There are unsaved changes on this page',

    revisionsText: 'Revisions',
    revisionsTextEmpty: 'No Revisions',
    revisionsTitle: null,
    revisionsCreated: 'Created',
    revisionsApplyButtonTitle: 'Rollback',
    revisionsApplyButtonText: 'Rollback',
    revisionsAJAXFailed: 'Failed to retrieve revisions',
    revisionsApplyButtonDialogCancelButton: 'Cancel',
    revisionsApplyButtonDialogOKButton: 'Rollback',
    revisionsApplyButtonDialogTitle: 'Rollback Confirmation',
    revisionsApplyDialogContent: 'This will replace the current content with the selected revision.<br/>The current content will be added as a revision, and will be visible in the revisions list for this block.',
    revisionsDialogCancelButton: 'Cancel',
    revisionsDialogTitle: 'View content revisions',
    revisionsButtonCurrent: 'Current',
    revisionsButtonViewDiffText: 'Differences',
    revisionsButtonViewDiffTitle: null,
    revisionsDiffButtonDialogCancelButton: 'Close',
    revisionsDiffButtonDialogTitle: 'View differences',
    revisionsDiffButtonTitle: 'View differences',
    revisionsDiffButtonText: 'View differences',
    revisionsLoading: 'Loading revisions...',
    revisionsNone: 'No revisions for this element',
    revisionsPreviewButtonTitle: 'Preview',
    revisionsPreviewButtonText: 'Preview',

    fileManagerDialogTitle: 'File Manager',
    fileManagerTitle: 'File Manager',
    rfmClose: 'Close',
    rfmContinue: 'Continue',
    rfmDeleteTitle: 'Delete',
    rfmDownloadTitle: 'Download',
    rfmEditTitle: 'Edit',
    rfmFileActions: 'Actions',
    rfmFileModificationTime: 'Modified',
    rfmFileName: 'Name',
    rfmFileSize: 'Size',
    rfmFileType: 'Type',
    rfmFilteredTotal: 'Showing {{start}} to {{end}} of {{filteredTotal}} files',
    rfmFirst: 'First',
    rfmHeadingDirectories: 'Directories',
    rfmHeadingSearch: 'Search',
    rfmHeadingTags: 'Tags',
    rfmHeadingUpload: 'Upload',
    rfmInsertTitle: 'Insert',
    rfmLast: 'Last',
    rfmRenameTitle: 'Rename',
    rfmSearch: 'Go',
    rfmTagDocument: 'Document',
    rfmTagImage: 'Image',
    rfmTotal: ', filtered from {{total}}',
    rfmUpload: 'Upload',
    rfmUploadBrowse: 'Browse',
    rfmUploadDrop: 'Drop Files Here',
    rfmUploadFileRemove: 'Remove',
    rfmUploadOr: 'or',
    rfmViewTitle: 'View',

    imageEditorDialogCancelButton: 'Cancel',
    imageEditorDialogOKButton: 'Save',
    imageEditorDialogTitle: 'Image Editor',
    imageEditorTitle: 'Edit Image',
    rieApply: 'Apply',
    rieBlurTitle: 'Blur',
    rieBrightnessTitle: 'Brightness/Contrast',
    rieCancel: 'Cancel',
    rieCancelTitle: 'Cancel',
    rieColorAdjustTitle: 'Adjust Color',
    rieCropTitle: 'Crop',
    rieDesaturateTitle: 'Desaturate',
    rieFlipHTitle: 'Flip Horizontally',
    rieFlipVTitle: 'Flip Vertically',
    rieGlowTitle: 'Glow',
    rieHslTitle: 'Hue, Saturation, Lightness.',
    rieInvertTitle: 'Invert',
    riePosterizeTitle: 'Posterize',
    rieRedoTitle: 'Redo',
    rieRemoveNoiseTitle: 'Remove Noise',
    rieResizeTitle: 'Resize',
    rieRevertTitle: 'Revert',
    rieRotateLeftTitle: 'Rotate Left',
    rieRotateRightTitle: 'Rotate Right',
    rieSaveTitle: 'Save',
    rieSaveTitle: 'Save',
    rieSepiaTitle: 'Sepia',
    rieSharpenTitle: 'Sharpen',
    rieSolarizeTitle: 'Solarize',
    rieUndoTitle: 'Undo',
    rieUploadTitle: 'Upload',

    rieActionColorAdjustRed: 'Red',
    rieActionColorAdjustGreen: 'Green',
    rieActionColorAdjustBlue: 'Blue',
    rieActionBrightnessBrightness: 'Brightness',
    rieActionBrightnessContrast: 'Contrast',
    rieActionGlowAmount: 'Glow Amount',
    rieActionGlowRadius: 'Glow Radius',
    rieActionHslHue: 'Hue',
    rieActionHslSaturation: 'Saturation',
    rieActionHslLightness: 'Lightness',
    rieActionPosterize: 'Levels',
    rieActionPosterizeLevels: 'Posterize Levels',

    viewSourceDialogCancelButton: 'Close',
    viewSourceDialogOKButton: 'Apply source code',
    viewSourceDialogTitle: 'Content source code',
    viewSourceTitle: 'View/edit source code'
});
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-locales/en.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/action.js
/**
 * @fileOverview Action helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Previews an action on an element.
 * @todo check descriptions for accuracy
 * @param {Object} previewState The saved state of the target.
 * @param {jQuery} target Element to have the preview applied to it.
 * @param {function} action The action to be previewed.
 * @returns {Object} ??
 */
function actionPreview(previewState, target, action) {
    // <strict>
    if (!typeIsElement(target)) {
        handleError("Target must be a jQuery instance when previewing an action", target);
    }
    // </strict>

    actionPreviewRestore(previewState, target);

    previewState = stateSave(target);
    action();
    rangy.getSelection().removeAllRanges();
    return previewState;
}

/**
 * Changes an element back to its saved state and returns that element.
 * @todo check descriptions please.
 * @param {Object} previewState The previously saved state of the target.
 * @param {jQuery} target The element to have it's state restored.
 * @returns {jQuery} The restored target.
 */
function actionPreviewRestore(previewState, target) {
    if (previewState) {
        var state = stateRestore(target, previewState);
        if (state.ranges) {
            rangy.getSelection().setRanges(state.ranges);
        }
        return state.element;
    }
    return target;
}

/**
 * Applies an action.
 * @todo types for params
 * @param {type} action The action to apply.
 * @param {type} history
 */
function actionApply(action, history) {
    action();
}

/**
 * Undoes an action.
 *
 * @returns {undefined}
 */
function actionUndo() {

}

/**
 * Redoes an action.
 *
 * @returns {undefined}
 */
function actionRedo() {

}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/action.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/clean.js
/**
 * @fileOverview Cleaning helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen - david@panmedia.co.nz
 * @author Michael Robinson - michael@panmedia.co.nz
 */

/**
 * Replaces elements in another elements. E.g.
 *
 * @example
 * cleanReplaceElements('.content', {
 *     'b': '<strong/>',
 *     'i': '<em/>',
 * });
 *
 * @param  {jQuery|Element|Selector} selector The element to be find and replace in.
 * @param  {Object} replacements A map of selectors to replacements. The replacement
 *   can be a jQuery object, an element, or a selector.
 */
function cleanReplaceElements(selector, replacements) {
    for (var find in replacements) {
        var replacement = replacements[find];
        var i = 0;
        var found = false;
        do {
            found = $(selector).find(find);
            if (found.length) {
                found = $(found.get(0));
                var clone = $(replacement).clone();
                clone.html(found.html());
                clone.attr(elementGetAttributes(found));
                found.replaceWith(clone);
            }
        } while(found.length);
    }
}

/**
 * Unwrap function. Currently just wraps jQuery.unwrap() but may be extended in future.
 *
 * @param  {jQuery|Element|Selector} selector The element to unwrap.
 */
function cleanUnwrapElements(selector) {
    $(selector).unwrap();
}

/**
 * Takes a supplied element and removes all of the empty attributes from it.
 *
 * @param {jQuery} element This is the element to remove all the empty attributes from.
 * @param {array} attributes This is an array of the elements attributes.
 */
function cleanEmptyAttributes(element, attributes) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Paramter 1 to cleanEmptyAttributes is expected a jQuery element');
        return;
    }
    // </strict>

    for (i = 0; i < attributes.length; i++) {
        if (!$.trim(element.attr(attributes[i]))) {
            element.removeAttr(attributes[i]);
        }
        element
            .find('[' + attributes[i] + ']')
            .filter(function() {
                return $.trim($(this).attr(attributes[i])) === '';
            }).removeAttr(attributes[i]);
    }
}

/**
 * Remove comments from element.
 *
 * @param  {jQuery} parent The jQuery element to have comments removed from.
 * @return {jQuery} The modified parent.
 */
function cleanRemoveComments(parent) {
    // <strict>
    if (!typeIsElement(parent)) {
        handleInvalidArgumentError('Paramter 1 to cleanRemoveComments is expected a jQuery element');
        return;
    }
    // </strict>

    parent.contents().each(function() {
        if (this.nodeType == Node.COMMENT_NODE) {
            $(this).remove();
        }
    });
    parent.children().each(function() {
        cleanRemoveComments($(this));
    });
    return parent;
}


/**
 * Removed empty elements whose tag name matches the list of supplied tags.
 *
 * @param  {jQuery} element The jQuery element to have empty element removed from.
 * @param  {String[]} tags The list of tags to clean.
 * @return {jQuery} The modified element.
 */
function cleanEmptyElements(element, tags) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Paramter 1 to cleanEmptyElements is expected a jQuery element');
        return;
    }
    // </strict>
    var found;
    // Need to loop incase removing an empty element, leaves another one.
    do {
        found = false;
        element.find(tags.join(',')).each(function() {
            var html = $(this).html().replace('&nbsp;', ' ').trim();
            if (html === '') {
                $(this).remove();
                found = true;
            }
        });
    } while (found);
    return element;
}

/**
 * Wraps any text nodes in the node with the supplied tag. This does not scan child elements.
 *
 * @param  {Node} node
 * @param  {String} tag The tag to use from wrapping the text nodes.
 */
function cleanWrapTextNodes(node, tag) {
    // <strict>
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Paramter 1 to cleanWrapTextNodes is expected a node.');
        return;
    }
    // </strict>

    var textNodes = nodeFindTextNodes(node);
    for (var i = 0, l = textNodes.length; i < l; i++) {
        var clone = textNodes[i].cloneNode(),
            wrapper = document.createElement(tag);
        wrapper.appendChild(clone);
        node.insertBefore(wrapper, textNodes[i]);
        node.removeChild(textNodes[i]);
    }
}

function cleanUnnestElement(element, selector) {
    var found;
    do {
        found = false;
        $(element).find(selector).each(function() {
            if ($(this).parent().is(selector)) {
                $(this).unwrap();
                found = true;
            }
        });
    } while (found);

}

function cleanRemoveAttributes(element, attributes) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Paramter 1 to cleanRemoveAttributes is expected a jQuery element');
        return;
    }
    // </strict>

    for (var i = 0; i < attributes.length; i++) {
        element.find('[' + attributes[i] + ']').removeAttr(attributes[i])
    }
}

function cleanRemoveElements(element, elements) {
    element.find(elements.join(',')).contents().unwrap();
}

/**
 * Generic clean function to remove misc elements.
 *
 * @param  {jQuery} element
 */
function clean(element) {
    $(element).find('.rangySelectionBoundary').remove();
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/clean.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/dock.js
/**
 * @fileOverview Docking to screen and element helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Docks a specified element to the screen.
 *
 * @param {jQuery} element The element to dock.
 * @param {string} options Any options to further specify the docking state.
 * @returns {Object} An object containing the docked element, a spacer div and the style state.
 */
function dockToScreen(element, options) {
    var position,
        spacer = $('<div>')
            .addClass('spacer');
    if (options.position === 'top') {
        position = {
            position: 'fixed',
            top: options.under ? $(options.under).outerHeight() : 0,
            left: 0,
            right: 0
        };
        if (options.spacer) {
            if (options.under) {
                spacer.insertAfter(options.under);
            } else {
                spacer.prependTo('body');
            }
        }
    } else if (options.position === 'topLeft') {
        position = {
            position: 'fixed',
            top: options.under ? $(options.under).outerHeight() : 0,
            left: 0
        };
        if (options.spacer) {
            if (options.under) {
                spacer.insertAfter(options.under);
            } else {
                spacer.prependTo('body');
            }
        }
    } else if (options.position === 'topRight') {
        position = {
            position: 'fixed',
            top: options.under ? $(options.under).outerHeight() : 0,
            right: 0
        };
        if (options.spacer) {
            if (options.under) {
                spacer.insertAfter(options.under);
            } else {
                spacer.prependTo('body');
            }
        }
    } else if (options.position === 'bottom') {
        position = {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0
        };
        if (options.spacer) {
            spacer.appendTo('body');
        }
    } else if (options.position === 'bottomLeft') {
        position = {
            position: 'fixed',
            bottom: 0,
            left: 0
        };
        if (options.spacer) {
            spacer.appendTo('body');
        }
    } else if (options.position === 'bottomRight') {
        position = {
            position: 'fixed',
            bottom: 0,
            right: 0
        };
        if (options.spacer) {
            spacer.appendTo('body');
        }
    }
    var styleState = styleSwapState(element, position);
    spacer.css('height', element.outerHeight());
    setTimeout(function() {
        spacer.css('height', element.outerHeight());
    }, 300);
    return {
        dockedElement: element,
        spacer: spacer,
        styleState: styleState
    };
}

/**
 * Undocks a docked element from the screen.
 * @todo not sure of description for dockState
 * @param {jQuery} dockState
 * @returns {unresolved}
 */
function undockFromScreen(dockState) {
    styleRestoreState(dockState.dockedElement, dockState.styleState);
    dockState.spacer.remove();
    return dockState.dockedElement.detach();
}

/**
 * Docks an element to a another element.
 *
 * @param {jQuery} elementToDock This is the element to be docked.
 * @param {jQuery} dockTo This is the element to which the elementToDock will be docked to.
 * @param {string} options These are any options to refine the docking position.
 * @returns {Object} An object containing the docked element, what it has been docked to, and their style states.
 */
function dockToElement(elementToDock, dockTo, options) {
    var wrapper = dockTo
            .wrap('<div>')
            .parent(),
        innerStyleState = styleSwapWithWrapper(wrapper, dockTo, {
            'float': 'none',
            display: 'block',
            clear: 'none',
            position: 'static',

            /* Margin */
            margin: 0,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0,
            marginBottom: 0,

            /* Padding */
            padding: 0,
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,

            outline: 0,
            width: 'auto',
            border: 'none'
        }),
        dockedElementStyleState = styleSwapState(elementToDock, {
            position: 'static'
        });
    wrapper
        .prepend(elementToDock)
        .addClass(options.wrapperClass ? options.wrapperClass : '');
    return {
        dockedElement: elementToDock,
        dockedTo: dockTo,
        innerStyleState: innerStyleState,
        dockedElementStyleState: dockedElementStyleState
    };
}

/**
 * Undocks an element from the screen.
 *@todo not sure of description for dockState
 * @param {jQuery} dockState
 * @returns {Object} The undocked element.
 */
function undockFromElement(dockState) {
    styleRestoreState(dockState.dockedTo, dockState.innerStyleState);
    styleRestoreState(dockState.dockedElement, dockState.dockedElementStyleState);
    var dockedElement = dockState.dockedElement.detach();
    dockState.dockedTo.unwrap();
    return dockedElement;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/dock.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/element.js
/**
 * @fileOverview Element manipulation helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Remove all but the allowed attributes from the parent.
 *
 * @param {jQuery} parent The jQuery element to cleanse of attributes.
 * @param {String[]|null} allowedAttributes An array of allowed attributes.
 * @return {jQuery} The modified parent.
 */
function elementRemoveAttributes(parent, allowedAttributes) {
    parent.children().each(function() {
        var stripAttributes = $.map(this.attributes, function(item) {
            if ($.inArray(item.name, allowedAttributes) === -1) {
                return item.name;
            }
        });
        var child = $(this);
        $.each(stripAttributes, function(i, attributeName) {
            child.removeAttr(attributeName);
        });
        element.removeAttributes($(this), allowedAttributes);
    });
    return parent;
}

/**
 * Sets the z-index CSS property on an element to 1 above all its sibling elements.
 *
 * @param {jQuery} element The jQuery element to have it's z index increased.
 */
function elementBringToTop(element) {
    var zIndex = 1;
    element.siblings().each(function() {
        var z = $(this).css('z-index');
        if (!isNaN(z) && z > zIndex) {
            zIndex = z + 1;
        }
    });
    element.css('z-index', zIndex);
}

/**
 * Retrieve outer html from an element.
 *
 * @param  {jQuery} element The jQuery element to retrieve the outer HTML from.
 * @return {String} The outer HTML.
 */
function elementOuterHtml(element) {
    return element.clone().wrap('<div/>').parent().html();
}

/**
 * Retrieve outer text from an element.
 *
 * @param  {jQuery} element The jQuery element to retrieve the outer text from.
 * @return {String} The outer text.
 */
function elementOuterText(element) {
    return element.clone().wrap('<div/>').parent().text();
}

/**
 * Determine whether element is block.
 *
 * @param  {Element} element The element to test.
 * @return {Boolean} True if the element is a block element
 */
function elementIsBlock(element) {
    return elementDefaultDisplay(element.tagName) === 'block';
}

/**
 * Determine whether element contains a block element.
 *
 * @param  {Element} element
 * @return {Boolean} True if the element contains a block element, false otherwise.
 */
function elementContainsBlockElement(element) {
    var containsBlock = false;
    element.contents().each(function() {
        if (!typeIsTextNode(this) && elementIsBlock(this)) {
            containsBlock = true;
            return;
        }
    });
    return containsBlock;
}

/**
 * Determine whether element is inline or block.
 *
 * @see http://stackoverflow.com/a/2881008/187954
 * @param  {string} tag Lower case tag name, e.g. 'a'.
 * @return {string} Default display style for tag.
 */
function elementDefaultDisplay(tag) {
    var cStyle,
        t = document.createElement(tag),
        gcs = "getComputedStyle" in window;

    document.body.appendChild(t);
    cStyle = (gcs ? window.getComputedStyle(t, "") : t.currentStyle).display;
    document.body.removeChild(t);

    return cStyle;
}

/**
 * Check that the given element is one of the the given tags.
 *
 * @param  {jQuery|Element} element The element to be tested.
 * @param  {Array}  validTags An array of valid tag names.
 * @return {Boolean} True if the given element is one of the give valid tags.
 */
function elementIsValid(element, validTags) {
    return -1 !== $.inArray($(element)[0].tagName.toLowerCase(), validTags);
}

/**
 * According to the given array of valid tags, find and return the first invalid
 * element of a valid parent. Recursively search parents until the wrapper is
 * encountered.
 *
 * @param  {Node} element
 * @param  {string[]} validTags
 * @param  {Element} wrapper
 * @return {Node}           [description]
 */
function elementFirstInvalidElementOfValidParent(element, validTags, wrapper) {
    // <strict>
    if (!typeIsNode(element)) {
        handleInvalidArgumentError('Parameter 1 to elementFirstInvalidElementOfValidParent must be a node', element);
        return;
    }
    // </strict>
    var parent = element.parentNode;
    if (parent[0] === wrapper[0]) {
        // <strict>
        if (!elementIsValid(parent, validTags)) {
            handleError('elementFirstInvalidElementOfValidParent requires a valid wrapper');
            return;
        }
        // </strict>
        return element;
    }
    if (elementIsValid(parent, validTags)) {
        return element;
    }
    return elementFirstInvalidElementOfValidParent(parent, validTags, wrapper);
}

/**
 * Calculate and return the visible rectangle for the element.
 *
 * @param  {jQuery|Element} element The element to calculate the visible rectangle for.
 * @return {Object} Visible rectangle for the element.
 */
function elementVisibleRect(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to elementVisibleRect is expected to be a jQuery compatible object', element);
        return;
    }
    // </strict>
    element = $(element);

    var rect = {
        top: Math.round(element.offset().top),
        left: Math.round(element.offset().left),
        width: Math.round(element.outerWidth()),
        height: Math.round(element.outerHeight())
    };


    var scrollTop = $(window).scrollTop();
    var windowHeight = $(window).height();
    var scrollBottom = scrollTop + windowHeight;
    var elementBottom = Math.round(rect.height + rect.top);

    // If top & bottom of element are within the viewport, do nothing.
    if (scrollTop < rect.top && scrollBottom > elementBottom) {
        return rect;
    }

    // Top of element is outside the viewport
    if (scrollTop > rect.top) {
        rect.top = scrollTop;
    }

    // Bottom of element is outside the viewport
    if (scrollBottom < elementBottom) {
        rect.height = scrollBottom - rect.top;
    } else {
        // Bottom of element inside viewport
        rect.height = windowHeight - (scrollBottom - elementBottom);
    }

    return rect;
}

/**
 * Returns a map of an elements attributes and values. The result of this function
 * can be passed directly to $('...').attr(result);
 *
 * @param  {jQuery|Element|Selector} element The element to get the attributes from.
 * @return {Object} A map of attribute names mapped to their values.
 */
function elementGetAttributes(element) {
    var attributes = $(element).get(0).attributes,
        result = {};
    for (var i = 0, l = attributes.length; i < l; i++) {
        result[attributes[i].name] = attributes[i].value;
    }
    return result;
}

/**
 * Gets the styles of an element.
 * @todo the type for result.
 * FIXME: this function needs reviewing.
 * @param {jQuerySelector|jQuery|Element} element This is the element to get the style from.
 * @returns {unresolved} The style(s) of the element.
 */
function elementGetStyles(element) {
    var result = {};
    var style = window.getComputedStyle(element[0], null);
    for (var i = 0; i < style.length; i++) {
        result[style.item(i)] = style.getPropertyValue(style.item(i));
    }
    return result;
}

/**
 * Wraps the inner content of an element with a tag.
 *
 * @param {jQuerySelector|jQuery|Element} element The element(s) to wrap.
 * @param {String} tag The wrapper tag name
 * @returns {jQuery} The wrapped element.
 */
function elementWrapInner(element, tag) {
    var result = new jQuery();
    selectionSave();
    for (var i = 0, l = element.length; i < l; i++) {
        var wrapper = $('<' + tag + '/>').html($(element[i]).html());
        element.html(wrapper);
        result.push(wrapper[0]);
    }
    selectionRestore();
    return result;
}

/**
 * Toggles the styles of an element.
 *
 * FIXME: this function needs reviewing
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element The jQuery element to have it's style changed.
 * @param {type} styles The styles to add or remove from the element.
 * @returns {undefined}
 */
function elementToggleStyle(element, styles) {
    $.each(styles, function(property, value) {
        if ($(element).css(property) === value) {
            $(element).css(property, '');
        } else {
            $(element).css(property, value);
        }
    });
}

/**
 * Swaps the styles of two elements.
 *
 * @param {jQuery|Element} element1 The element for element 2 to get its styles from.
 * @param {jQuery|Element} element2 The element for element 1 to get its styles from.
 * @param {Object} style The style to be swapped between the two elements.
 */
function elementSwapStyles(element1, element2, style) {
    for (var name in style) {
        element1.css(name, element2.css(name));
        element2.css(name, style[name]);
    }
}

/**
 * Checks if an element is empty.
 *
 * @param {Element} element The element to be checked.
 * @returns {Boolean} Returns true if element is empty.
 */
function elementIsEmpty(element) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Parameter 1 to elementIsEmpty must be a jQuery element', element);
        return;
    }
    // </strict>

    // Images and elements containing images are not empty
    if (element.is('img') || element.find('img').length) {
        return false;
    }
    if ((/&nbsp;/).test(element.html())) {
        return false;
    }
    return element.text() === '';
}

/**
 * Positions an element underneath another element.
 *
 * @param {jQuery} element Element to position.
 * @param {jQuery} under Element to position under.
 */
function elementPositionUnder(element, under) {
    var pos = $(under).offset(),
        height = $(under).outerHeight();
    $(element).css({
        top: (pos.top + height - $(window).scrollTop()) + 'px',
        left: pos.left + 'px'
    });
}

/**
 * Removes the element from the DOM to manipulate it using a function passed to the method, then replaces it back to it's origional position.
 *
 * @todo desc and type for manip
 * @param {jQuery|Element} element The element to be manipulated.
 * @param {type} manip A function used to manipulate the element i think.
 */
function elementDetachedManip(element, manip) {
    var parent = $(element).parent();
    $(element).detach();
    manip(element);
    parent.append(element);
}

/**
 * Finds the closest parent, up to a limit element, to the supplied element that is not an display inline or null.
 * If the parent element is the same as the limit element then it returns null.
 *
 * @param {jQuery} element The element to find the closest parent of.
 * @param {jQuery} limitElement The element to stop looking for the closest parent at.
 * @returns {jQuery} Closest element that is not display inline or null, or null if the parent element is the same as the limit element.
 */
function elementClosestBlock(element, limitElement) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Parameter 1 to elementClosestBlock must be a jQuery element', element);
        return;
    }
    if (!typeIsElement(limitElement)) {
        handleInvalidArgumentError('Parameter 2 to elementClosestBlock must be a jQuery element', limitElement);
        return;
    }
    // </strict>
    while (element.length > 0 &&
        element[0] !== limitElement[0] &&
        (element[0].nodeType === Node.TEXT_NODE || element.css('display') === 'inline')) {
        element = element.parent();
    }
    if (element[0] === limitElement[0]) {
        return null;
    }
    return element;
}

/**
 * Generates a unique id.
 *
 * @returns {String} The unique id.
 */
function elementUniqueId() {
    var id = 'ruid-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000);
    while ($('#' + id).length) {
        id = 'ruid-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000);
    }
    return id;
}

/**
 * Changes the tags on a given element.
 *
 * @todo not sure of details of return
 * @param {jQuerySelector|jQuery|Element} element The element(s) to have it's tags changed
 * @param {Element} newTag The new tag for the element(s)
 * @returns {Element}
 */
function elementChangeTag(element, newTag) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Parameter 1 to elementChangeTag must be a jQuery element', element);
    }
    // </strict>
    var tags = [];
    for (var i = element.length - 1; 0 <= i ; i--) {
        var node = document.createElement(newTag);
        node.innerHTML = element[i].innerHTML;
        $.each(element[i].attributes, function() {
            $(node).attr(this.name, this.value);
        });
        $(element[i]).after(node).remove();
        tags[i] = node;
    }
    return $(tags);
}

/**
 * Positions an element over top of another element.
 *  - If the other element is big, then the element is positioned in the center of the visible part of the other element.
 *  - If the other element is small and not at the top of the screen, the other element is positioned at the top of the other element.
 *  - If the other element is small and not is at the top of the screen, the other element is positioned at the bottom of the other element.
 *
 * @param {Element} element The element to position.
 * @param {Element} over The element to position over.
 */
function elementPositionOver(element, over) {
    if (element.outerHeight() > over.outerHeight() - 20) {
        var visibleRect = elementVisibleRect(over),
            offset = over.offset();
        element.css({
            position: 'absolute',
            // Calculate offset center for the element
            top:  offset.top - element.outerHeight(),
            left: visibleRect.left + ((visibleRect.width / 2)  - (element.outerWidth()  / 2))
        });
    } else {
        var visibleRect = elementVisibleRect(over);
        element.css({
            position: 'absolute',
            // Calculate offset center for the element
            top:  visibleRect.top  + ((visibleRect.height / 2) - (element.outerHeight() / 2)),
            left: visibleRect.left + ((visibleRect.width / 2)  - (element.outerWidth()  / 2))
        });
    }
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/element.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/fragment.js
/**
 * @fileOverview DOM fragment manipulation helper functions
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Convert a DOMFragment to an HTML string. Optionally wraps the string in a tag.
 * @todo type for domFragment and tag.
 * @param {type} domFragment The fragment to be converted to a HTML string.
 * @param {type} tag The tag that the string may be wrapped in.
 * @returns {String} The DOMFragment as a string, optionally wrapped in a tag.
 */
function fragmentToHtml(domFragment, tag) {
    var html = '';
    // Get all nodes in the extracted content
    for (var j = 0, l = domFragment.childNodes.length; j < l; j++) {
        var node = domFragment.childNodes.item(j);
        var content = node.nodeType === Node.TEXT_NODE ? node.nodeValue : elementOuterHtml($(node));
        if (content) {
            html += content;
        }
    }
    if (tag) {
        html = $('<' + tag + '>' + html + '</' + tag + '>');
        html.find('p').wrapInner('<' + tag + '/>');
        html.find('p > *').unwrap();
        html = $('<div/>').html(html).html();
    }
    return html;
}

/**
 * Insert a DOMFragment before an element and wraps them both in a tag.
 *
 * @public @static
 * @param {DOMFragment} domFragment This is the DOMFragment to be inserted.
 * @param {jQuerySelector|jQuery|Element} beforeElement This is the element the DOMFragment is to be inserted before.
 * @param {String} wrapperTag This is the tag to wrap the domFragment and the beforeElement in.
 */
function fragmentInsertBefore(domFragment, beforeElement, wrapperTag) {
    // Get all nodes in the extracted content
    for (var j = 0, l = domFragment.childNodes.length; j < l; j++) {
        var node = domFragment.childNodes.item(j);
        // Prepend the node before the current node
        var content = node.nodeType === Node.TEXT_NODE ? node.nodeValue : $(node).html();
        if (content) {
            $('<' + wrapperTag + '/>')
                .html($.trim(content))
                .insertBefore(beforeElement);
        }
    }
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/fragment.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/node.js
/**
 * @fileOverview Find node parent helper function.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */


/**
 * Find the first parent of a node that is not a text node.
 *
 * @param {Node} node
 * @returns {Node}
 */
function nodeFindParent(node) {
    while (node.nodeType === Node.TEXT_NODE) {
        node = node.parentNode;
    }
    return node;
}

function nodeFindTextNodes(node) {
    var textNodes = [], whitespace = /^\s*$/;
    for (var i = 0, l = node.childNodes.length; i < l; i++) {
        if (node.childNodes[i].nodeType == Node.TEXT_NODE) {
            if (!whitespace.test(node.childNodes[i].nodeValue)) {
                textNodes.push(node.childNodes[i]);
            }
        }
    }
    return textNodes;
}

function nodeIsChildOf(child, parent) {
     var node = child.parentNode;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/node.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/persist.js
/**
 * @fileOverview Storage helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Stores key-value data.
 * If local storage is already configured, retrieve what is stored and convert it to an array, otherwise create a blank array.
 * The value is then set in the array based on the key and the array is saved into local storage.
 * @todo desc and type for returns
 * @param {type} key The key for the data to be stored at
 * @param {type} value The data to be stored at the key.
 * @returns {persistSet} ??
 */
function persistSet(key, value) {
    if (localStorage) {
        var storage;
        if (localStorage.raptor) {
            storage = JSON.parse(localStorage.raptor);
        } else {
            storage = {};
        }
        storage[key] = value;
        localStorage.raptor = JSON.stringify(storage);
    }
}

/**
 * Gets the data stored at the supplied key.
 *
 * @param {type} key The key to get the stored data from.
 * @returns {Object} The data stored at the key.
 */
function persistGet(key) {
    if (localStorage) {
        var storage;
        if (localStorage.raptor) {
            storage = JSON.parse(localStorage.raptor);
        } else {
            storage = {};
        }
        return storage[key];
    }
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/persist.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/range.js
/**
 * @fileOverview Range manipulation helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Expands a range to to surround all of the content from its start container
 * to its end container.
 *
 * @param {RangyRange} range The range to expand.
 */
function rangeExpandToParent(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeExpandToParent is expected to be a range', range);
        return;
    }
    // </strict>
    range.setStartBefore(range.startContainer);
    range.setEndAfter(range.endContainer);
}

/**
 * Ensure range selects entire element.
 *
 * @param  {RangyRange} range
 * @param  {Element} element
 */
function rangeSelectElement(range, element) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeSelectElement is expected to be a range', range);
        return;
    }
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Parameter 2 to rangeSelectElement is expected to be a jQuery element', element);
        return;
    }
    // </strict>
    range.selectNode($(element)[0]);
}

function rangeSelectElementContent(range, element) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeSelectElementContent is expected to be a range', range);
        return;
    }
    if (!typeIsElement(element) && !typeIsNode(element)) {
        handleInvalidArgumentError('Parameter 2 to rangeSelectElementContent is expected to be a jQuery element or node', element);
        return;
    }
    // </strict>
    range.selectNodeContents($(element).get(0));
}

/**
 * Expand range to contain given elements.
 *
 * @param {RangyRange} range The range to expand.
 * @param {array} elements An array of elements to check the current range against.
 */
function rangeExpandTo(range, elements) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeReplace is expected to be a range', range);
        return;
    }
    if (!typeIsArray(elements)) {
        handleInvalidArgumentError('Parameter 2 to rangeExpandTo is expected to be an array', elements);
        return;
    }
    // </strict>
    do {
        rangeExpandToParent(range);
        for (var i = 0, l = elements.length; i < l; i++) {
            if ($(range.commonAncestorContainer).is(elements[i])) {
                return;
            }
        }
    } while (range.commonAncestorContainer);
}

/**
 * Replaces the content of range with the given html or node.
 *
 * @param  {RangyRange} range The range to replace.
 * @param  {Node|String} html The html or node to replace the range content with.
 * @return {Node[]} Array of new nodes inserted.
 */
function rangeReplace(range, html) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeReplace is expected to be a range', range);
        return;
    }
    if (!typeIsNode(html) && !typeIsString(html)) {
        handleInvalidArgumentError('Parameter 2 to rangeReplace is expected to be a string or a node', html);
        return;
    }
    // </strict>

    var newNodes = [];
    range.deleteContents();
    if (html.nodeType) {
        // Node
        newNodes.push(html.cloneNode(true));
        range.insertNode(newNodes[0]);
    } else {
        // HTML string
        var wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        for (var i = 0; i < wrapper.childNodes.length; i++) {
            var clone = wrapper.childNodes[i].cloneNode(true);
            range.insertNodeAtEnd(clone);
            newNodes.push(clone);
        }
    }
    return newNodes;
}

/**
 * Empties a supplied range of all the html tags.
 *
 * @param {RangyRange} range This is the range to remove tags from.
 * @returns {boolean} True if the range is empty.
 */
function rangeEmptyTag(range) {
    var html = rangeToHtml(range);
    if (typeof html === 'string') {
        html = html.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/@])/g,'\\$1');
    }
    return stringHtmlStringIsEmpty(html);
}

/**
 * @param  {RangyRange} range
 * @return {Node} The range's start element.
 */
function rangeGetStartElement(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeGetStartElement is expected to be a range', range);
    }
    // </strict>
    return nodeFindParent(range.startContainer);
}

/**
 * @param  {RangyRange} range
 * @return {Node} The range's end element.
 */
function rangeGetEndElement(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeGetEndElement is expected to be a range', range);
    }
    // </strict>
    return nodeFindParent(range.endContainer);
}

/**
 * Returns a single selected range's common ancestor.
 * Works for single ranges only.
 *
 * @param {RangyRange} range
 * @return {Element} The range's common ancestor.
 */
function rangeGetCommonAncestor(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeGetCommonAncestor is expected to be a range', range);
    }
    // </strict>
    return nodeFindParent(range.commonAncestorContainer);
}

/**
 * Returns true if the supplied range is empty (has a length of 0)
 *
 * @public @static
 * @param {RangyRange} range The range to check if it is empty
 */
function rangeIsEmpty(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeGetCommonAncestor is expected to be a range', range);
    }
    // </strict>
    return range.startOffset === range.endOffset &&
           range.startContainer === range.endContainer;
}

/**
 * @param  {RangyRange} range
 * @param  {Node} node
 * @return {boolean} True if the range is entirely contained by the given node.
 */
function rangeIsContainedBy(range, node) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeIsContainedBy is expected to be a range', range);
    }
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to rangeIsContainedBy is expected to be a node', node);
    }
    // </strict>
    var nodeRange = range.cloneRange();
    nodeRange.selectNodeContents(node);
    return nodeRange.containsRange(range);
}

/**
 * @param  {RangyRange} range
 * @param  {Node} node
 * @return {Boolean} True if node is contained within the range, false otherwise.
 */
function rangeContainsNode(range, node) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeContainsNode is expected to be a range', range);
    }
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to rangeContainsNode is expected to be a node', node);
    }
    // </strict>
    return range.containsNode(node);
}

/**
 * Tests whether the range contains all of the text (within text nodes) contained
 * within node. This is to provide an intuitive means of checking whether a range
 * "contains" a node if you consider the range as just in terms of the text it
 * contains without having to worry about niggly details about range boundaries.
 *
 * @param  {RangyRange} range
 * @param  {Node} node
 * @return {Boolean}
 */
function rangeContainsNodeText(range, node) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeContainsText is expected to be a range', range);
    }
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to rangeContainsText is expected to be a node', node);
    }
    // </strict>
    return range.containsNodeText(node);
}

/**
 * Removes the white space at the start and the end of the range.
 *
 * @param {RangyRange} range This is the range of selected text.
 */
function rangeTrim(range) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeTrim is expected to be a range', range);
    }
    // </strict>
    if (range.startContainer.data) {
        while (/\s/.test(range.startContainer.data.substr(range.startOffset, 1))) {
            range.setStart(range.startContainer, range.startOffset + 1);
        }
    }

    if (range.endContainer.data) {
        while (range.endOffset > 0 && /\s/.test(range.endContainer.data.substr(range.endOffset - 1, 1))) {
            range.setEnd(range.endContainer, range.endOffset - 1);
        }
    }
}

/**
 * Serializes supplied ranges.
 *
 * @param {RangyRange} ranges This is the set of ranges to be serialized.
 * @param {Node} rootNode
 * @returns {String} A string of the serialized ranges separated by '|'.
 */
function rangeSerialize(range, rootNode) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeSerialize is expected to be an range', range);
    }
    if (!typeIsNode(rootNode)) {
        handleInvalidArgumentError('Parameter 1 to rangeSerialize is expected to be a node', rootNode);
    }
    // </strict>
    return rangy.serializeRange(range, true, rootNode);
}

/**
 * Deseralizes supplied ranges.
 *
 * @param {string} serialized This is the already serailized range to be deserialized.
 * @param {Node} rootNode
 * @returns {Array} An array of deserialized ranges.
 */
function rangeDeserialize(serialized, rootNode) {
    // <strict>
    if (!typeIsString(serialized)) {
        handleInvalidArgumentError('Parameter 1 to rangeDeserialize is expected to be a string', serialized);
    }
    // </strict>
    var serializedRanges = serialized.split("|"),
        ranges = [];
    for (var i = 0, l = serializedRanges.length; i < l; i++) {
        ranges[i] = rangy.deserializeRange(serializedRanges[i], rootNode);
    }
    return ranges;
}

/**
 * Split the selection container and insert the given html between the two elements created.
 *
 * @param  {RangyRange}
 * @param  {jQuery|Element|string} html The html to replace selection with.
 */
function rangeReplaceSplitInvalidTags(range, html, wrapper, validTagNames) {
    // <strict>
    if (!typeIsRange(range)) {
        handleInvalidArgumentError('Parameter 1 to rangeReplaceSplitInvalidTags is expected to be a range', range);
    }
    // </strict>
    var commonAncestor = rangeGetCommonAncestor(range);

    if (!elementIsValid(commonAncestor, validTagNames)) {
        commonAncestor = elementFirstInvalidElementOfValidParent(commonAncestor, validTagNames, wrapper);
    }

    // Select from start of selected element to start of selection
    var startRange = rangy.createRange();
    startRange.setStartBefore(commonAncestor);
    startRange.setEnd(range.startContainer, range.startOffset);
    var startFragment = startRange.cloneContents();

    // Select from end of selected element to end of selection
    var endRange = rangy.createRange();
    endRange.setStart(range.endContainer, range.endOffset);
    endRange.setEndAfter(commonAncestor);
    var endFragment = endRange.cloneContents();

    // Replace the start element's html with the content that was not selected, append html & end element's html
    var replacement = elementOuterHtml($(fragmentToHtml(startFragment)));
    replacement += elementOuterHtml($(html).attr('data-replacement', true));
    replacement += elementOuterHtml($(fragmentToHtml(endFragment)));

    replacement = $(replacement);

    $(commonAncestor).replaceWith(replacement);
    replacement = replacement.parent().find('[data-replacement]').removeAttr('data-replacement');

    // Remove empty surrounding tags only if they're of the same type as the split element
    if (replacement.prev().is(commonAncestor.tagName.toLowerCase()) &&
        !replacement.prev().html().trim()) {
        replacement.prev().remove();
    }
    if (replacement.next().is(commonAncestor.tagName.toLowerCase()) &&
        !replacement.next().html().trim()) {
        replacement.next().remove();
    }
    return replacement;
}

/**
 * Replace the given range, splitting the parent elements such that the given html
 * is contained only by valid tags.
 *
 * @param  {RangyRange} range
 * @param  {string} html
 * @param  {Element} wrapper
 * @param  {string[]} validTagNames
 * @return {Element}
 */
function rangeReplaceWithinValidTags(range, html, wrapper, validTagNames) {
    var startElement = nodeFindParent(range.startContainer);
    var endElement = nodeFindParent(range.endContainer);
    var selectedElement = rangeGetCommonAncestor(range);

    var selectedElementValid = elementIsValid(selectedElement, validTagNames);
    var startElementValid = elementIsValid(startElement, validTagNames);
    var endElementValid = elementIsValid(endElement, validTagNames);

    // The html may be inserted within the selected element & selection start / end.
    if (selectedElementValid && startElementValid && endElementValid) {
        return rangeReplace(range, html);
    }

    // Context is invalid. Split containing element and insert list in between.
    return rangeReplaceSplitInvalidTags(range, html, wrapper, validTagNames);
}

function rangeToHtml(range) {
    return fragmentToHtml(range.cloneContents());
}

function rangeGet() {
    var selection = rangy.getSelection();
    if (selection.rangeCount > 0) {
        return selection.getRangeAt(0);
    }
    return null;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/range.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/selection.js
/**
 * @fileOverview Selection manipulation helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * @type {Boolean|Object} current saved selection.
 */
var savedSelection = false;

/**
 * Save selection wrapper, preventing plugins / UI from accessing rangy directly.
 * @todo check desc and type for overwrite.
 * @param {Boolean} overwrite True if selection is able to be overwritten.
 */
function selectionSave(overwrite) {
    if (savedSelection && !overwrite) return;
    savedSelection = rangy.saveSelection();
}

/**
 * Restore selection wrapper, preventing plugins / UI from accessing rangy directly.
 */
function selectionRestore() {
    if (savedSelection) {
        rangy.restoreSelection(savedSelection);
        savedSelection = false;
    }
}

/**
 * Reset saved selection.
 */
function selectionDestroy() {
    if (savedSelection) {
        rangy.removeMarkers(savedSelection);
    }
    savedSelection = false;
}

/**
 * Returns whether the selection is saved.
 *
 * @returns {Boolean} True if there is a saved selection.
 */
function selectionSaved() {
    return savedSelection !== false;
}

/**
 * Iterates over all ranges in a selection and calls the callback for each
 * range. The selection/range offsets is updated in every iteration in in the
 * case that a range was changed or removed by a previous iteration.
 *
 * @public @static
 * @param {function} callback The function to call for each range. The first and only parameter will be the current range.
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 * @param {object} [context] The context in which to call the callback.
 */
function selectionEachRange(callback, selection, context) {
    selection = selection || rangy.getSelection();
    var range, i = 0;
    // Create a new range set every time to update range offsets
    while (range = selection.getAllRanges()[i++]) {
        callback.call(context, range);
    }
}

/**
 * Replaces the current selection with the specified range.
 *
 * @param {RangySelection} mixed The specified range to replace the current range.
 */
function selectionSet(mixed) {
    rangy.getSelection().setSingleRange(mixed);
}

/**
 * Replaces the given selection (or the current selection if selection is not
 * supplied) with the given html or node.
 *
 * @public @static
 * @param  {Node|String} html The html or node to replace the selection with.
 * @param  {RangySelection|null} selection The selection to replace, or null to replace the current selection.
 * @return {Node[]} Array of new nodes inserted.
 */
function selectionReplace(html, selection) {
    var newNodes = [];
    selectionEachRange(function(range) {
        newNodes = newNodes.concat(rangeReplace(range, html));
    }, selection, this);
    return newNodes;
}

/**
 * Selects all the contents of the supplied element, excluding the element itself.
 *
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 */
 /*
function selectionSelectInner(element, selection) {
    selection = selection || rangy.getSelection();
    selection.removeAllRanges();
    $(element).focus().contents().each(function() {
        var range = rangy.createRange();
        range.selectNodeContents(this);
        selection.addRange(range);
    });
}
*/
/**
 * Selects all the contents of the supplied node, excluding the node itself.
 *
 * @public @static
 * @param {Node} node
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 */
function selectionSelectInner(node, selection) {
    // <strict>
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to selectionSelectInner is expected a Node', node);
        return;
    }
    // </strict>
    selection = selection || rangy.getSelection();
    var range = rangy.createRange();
    range.selectNodeContents(node);
    selection.setSingleRange(range);
}

/**
 * Selects all the contents of the supplied node, including the node itself.
 *
 * @public @static
 * @param {Node} node
 * @param {RangySelection} [selection] A RangySelection, or null to use the current selection.
 */
function selectionSelectOuter(node, selection) {
    // <strict>
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to selectionSelectOuter must be a node', node);
        return;
    }
    // </strict>
    var range = rangy.createRange();
    range.selectNode(node);
    rangy.getSelection().setSingleRange(range);
}

/**
 * Move selection to the start or end of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 * @param {Boolean} start True to select the start of the element.
 */
function selectionSelectEdge(element, selection, start) {
    selection = selection || rangy.getSelection();
    selection.removeAllRanges();

    $(element).each(function() {
        var range = rangy.createRange();
        range.selectNodeContents(this);
        range.collapse(start);
        selection.addRange(range);
    });
}

/**
 * Move selection to the end of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 */
function selectionSelectEnd(element, selection) {
    selectionSelectEdge(element, selection, false);
}

/**
 * Move selection to the start of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 */
function selectionSelectStart(element, selection) {
    selectionSelectEdge(element, selection, true);
}

/**
 * Extend selection to the end of element.
 *
 * @param  {Element} element
 * @param  {RangySelection|null} selection
 */
function selectionSelectToEndOfElement(element, selection) {
    // <strict>
    if (!typeIsElement(element)) {
        handleInvalidArgumentError('Parameter 1 to selectionSelectToEndOfElement is expected to be Element', element);
        return;
    }
    // </strict>
    selection = selection || rangy.getSelection();
    var range = selectionRange();
    selection.removeAllRanges();
    range.setEndAfter(element.get(0));
    selection.addRange(range);
}

/**
 * Gets the HTML from a selection. If no selection is supplied then current selection will be used.
 *
 * @param  {RangySelection|null} selection Selection to get html from or null to use current selection.
 * @return {string} The html content of the selection.
 */
function selectionGetHtml(selection) {
    selection = selection || rangy.getSelection();
    return selection.toHtml();
}

/**
 * Gets the closest common ancestor container to the given or current selection that isn't a text node.
 * @todo check please
 *
 * @param {RangySelection} range The selection to get the element from.
 * @returns {jQuery} The common ancestor container that isn't a text node.
 */
function selectionGetElement(range, selection) {
    selection = selection || rangy.getSelection();
    if (!selectionExists()) {
        return new jQuery;
    }
    var range = selectionRange(),
        commonAncestor;
    // Check if the common ancestor container is a text node
    if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
        // Use the parent instead
        commonAncestor = range.commonAncestorContainer.parentNode;
    } else {
        commonAncestor = range.commonAncestorContainer;
    }
    return $(commonAncestor);
}

/**
 * Gets all elements within and including the selection's common ancestor that contain a selection (excluding text nodes) and
 * returns them as a jQuery array.
 *
 * @public @static
 * @param {RangySelection|null} A RangySelection, or by default, the current selection.
 */
function selectionGetElements(selection) {
    var result = new jQuery();
    selectionEachRange(function(range) {
        result.push(selectionGetElement(range)[0]);
    }, selection, this);
    return result;
}

/**
 * Gets the start element of a selection.
 * @todo check the type of the return...i guessed and i have a feeling i might be wrong.
 * @returns {jQuery|Object} If the anchor node is a text node then the parent of the anchor node is returned, otherwise the anchor node is returned.
 */
function selectionGetStartElement() {
    var selection = rangy.getSelection();
    if (selection.anchorNode === null) {
        return null;
    }
    if (selection.isBackwards()) {
        return selection.focusNode.nodeType === Node.TEXT_NODE ? $(selection.focusNode.parentElement) : $(selection.focusNode);
    }
    if (!selection.anchorNode) console.trace();
    return selection.anchorNode.nodeType === Node.TEXT_NODE ? $(selection.anchorNode.parentElement) : $(selection.anchorNode);
}

/**
 * Gets the end element of the selection.
 * @returns {jQuery|Object} If the focus node is a text node then the parent of the focus node is returned, otherwise the focus node is returned.
 */
function selectionGetEndElement() {
    var selection = rangy.getSelection();
    if (selection.anchorNode === null) {
        return null;
    }
    if (selection.isBackwards()) {
        return selection.anchorNode.nodeType === Node.TEXT_NODE ? $(selection.anchorNode.parentElement) : $(selection.anchorNode);
    }
    return selection.focusNode.nodeType === Node.TEXT_NODE ? $(selection.focusNode.parentElement) : $(selection.focusNode);
}

/**
 * Checks to see if the selection is at the end of the element.
 *
 * @returns {Boolean} True if the node immediately after the selection ends does not exist or is empty,
 *                      false if the whole nodes' text is not selected or it doesn't fit the criteria for the true clause.
 */
function selectionAtEndOfElement() {
    var selection = rangy.getSelection();
    var focusNode = selection.isBackwards() ? selection.anchorNode : selection.focusNode;
    var focusOffset = selection.isBackwards() ? selection.focusOffset : selection.anchorOffset;
    if (focusOffset !== focusNode.textContent.length) {
        return false;
    }
    var previous = focusNode.nextSibling;
    if (!previous || $(previous).html() === '') {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks to see if the selection is at the start of the element.
 *
 * @returns {Boolean} True if the node immediately before the selection starts does not exist or is empty,
 *                      false if the whole nodes' text is not selected or it doesn't fit the criteria for the true clause.
 */
function selectionAtStartOfElement() {
    var selection = rangy.getSelection();
    var anchorNode = selection.isBackwards() ? selection.focusNode : selection.anchorNode;
    if (selection.isBackwards() ? selection.focusOffset : selection.anchorOffset !== 0) {
        return false;
    }
    var previous = anchorNode.previousSibling;
    if (!previous || $(previous).html() === '') {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks to see if the selection is empty.
 * @returns {Boolean} Returns true if the selection is empty.
 */
function selectionIsEmpty() {
    return rangy.getSelection().toHtml() === '';
}

/**
 * FIXME: this function needs reviewing.
 *
 * This should toggle an inline style, and normalise any overlapping tags, or adjacent (ignoring white space) tags.
 * @todo apparently this needs fixing and i'm not sure what it returns.
 * @public @static
 *
 * @param {String} tag This is the tag to be toggled.
 * @param {Array} options These are any additional properties to add to the element.
 * @returns {selectionToggleWrapper}
 */
function selectionToggleWrapper(tag, options) {
    options = options || {};
    var applier = rangy.createCssClassApplier(options.classes || '', {
        normalize: true,
        elementTagName: tag,
        elementProperties: options.attributes || {}
    });
    selectionEachRange(function(range) {
        if (rangeEmptyTag(range)) {
            var element = $('<' + tag + '/>')
                .addClass(options.classes)
                .attr(options.attributes || {})
                .append(fragmentToHtml(range.cloneContents()));
            rangeReplace(range, element[0]);
        } else {
            applier.toggleRange(range);
        }
    }, null, this);
}

/**
 * @todo method description and check types
 *
 * @param {String} tag The tag for the selection to be wrapped in.
 * @param {String} attributes The attributes to be added to the selection.
 * @param {String} classes The classes to be added to the selection
 */
function selectionWrapTagWithAttribute(tag, attributes, classes) {
    selectionEachRange(function(range) {
        var element = selectionGetElement(range);
        if (element.is(tag)) {
            element.attr(attributes);
        } else {
            selectionToggleWrapper(tag, {
                classes: classes,
                attributes: attributes
            });
        }
    }, null, this);
}

/**
 * Check if there is a current selection.
 *
 * @public @static
 * @returns {Boolean} Returns true if there is at least one range selected.
 */
function selectionExists() {
    return rangy.getSelection().rangeCount !== 0;
}

/**
 * Gets the first range in the current selection. In strict mode if no selection
 * exists an error occurs.
 *
 * @public @static
 * @returns {RangyRange} Returns true if there is at least one range selected.
 */
function selectionRange() {
    // <strict>
    if (!selectionExists()) {
        handleError('Tried to get selection range when there is no selection');
    }
    // </strict>
    return rangy.getSelection().getRangeAt(0);
}

/**
 * Split the selection container and insert the given html between the two elements created.
 * @param  {jQuery|Element|string} html The html to replace selection with.
 * @param  {RangySelection|null} selection The selection to replace, or null for the current selection.
 * @returns {Object} The selection container with it's new content added.
 */
function selectionReplaceSplittingSelectedElement(html, selection) {
    selection = selection || rangy.getSelection();

    var selectionRange = selectionRange();
    var selectedElement = selectionGetElements()[0];

    // Select from start of selected element to start of selection
    var startRange = rangy.createRange();
    startRange.setStartBefore(selectedElement);
    startRange.setEnd(selectionRange.startContainer, selectionRange.startOffset);
    var startFragment = startRange.cloneContents();

    // Select from end of selected element to end of selection
    var endRange = rangy.createRange();
    endRange.setStart(selectionRange.endContainer, selectionRange.endOffset);
    endRange.setEndAfter(selectedElement);
    var endFragment = endRange.cloneContents();

    // Replace the start element's html with the content that was not selected, append html & end element's html
    var replacement = elementOuterHtml($(fragmentToHtml(startFragment)));
    replacement += elementOuterHtml($(html).attr('data-replacement', true));
    replacement += elementOuterHtml($(fragmentToHtml(endFragment)));

    replacement = $(replacement);

    $(selectedElement).replaceWith(replacement);
    return replacement.parent().find('[data-replacement]').removeAttr('data-replacement');
}

/**
 * Replace current selection with given html, ensuring that selection container is split at
 * the start & end of the selection in cases where the selection starts / ends within an invalid element.
 *
 * @param  {jQuery|Element|string} html The html to replace current selection with.
 * @param  {Array} validTagNames An array of tag names for tags that the given html may be inserted into without having the selection container split.
 * @param  {RangySeleciton|null} selection The selection to replace, or null for the current selection.
 * @returns {Object} The replaced selection if everything is valid or the selection container with it's new content added.
 */
function selectionReplaceWithinValidTags(html, validTagNames, selection) {
    selection = selection || rangy.getSelection();

    if (!selectionExists()) {
        return;
    }

    var startElement = selectionGetStartElement()[0];
    var endElement = selectionGetEndElement()[0];
    var selectedElement = selectionGetElements()[0];

    var selectedElementValid = elementIsValid(selectedElement, validTagNames);
    var startElementValid = elementIsValid(startElement, validTagNames);
    var endElementValid = elementIsValid(endElement, validTagNames);

    // The html may be inserted within the selected element & selection start / end.
    if (selectedElementValid && startElementValid && endElementValid) {
        return selectionReplace(html);
    }

    // Context is invalid. Split containing element and insert list in between.
    return selectionReplaceSplittingSelectedElement(html, selection);
}

/**
 * Toggles style(s) on the first block level parent element of each range in a selection
 *
 * @public @static
 * @param {Object} styles styles to apply
 * @param {jQuerySelector|jQuery|Element} limit The parent limit element.
 * If there is no block level elements before the limit, then the limit content
 * element will be wrapped with a "div"
 */
function selectionToggleBlockStyle(styles, limit) {
    selectionEachRange(function(range) {
        var parent = $(range.commonAncestorContainer);
        while (parent.length && parent[0] !== limit[0] && (
                parent[0].nodeType === Node.TEXT_NODE || parent.css('display') === 'inline')) {
            parent = parent.parent();
        }
        if (parent[0] === limit[0]) {
            // Only apply block style if the limit element is a block
            if (limit.css('display') !== 'inline') {
                // Wrap the HTML inside the limit element
                elementWrapInner(limit, 'div');
                // Set the parent to the wrapper
                parent = limit.children().first();
            }
        }
        // Apply the style to the parent
        elementToggleStyle(parent, styles);
    }, null, this);
}

/**
 * Iterates throught each block in the selection and calls the callback function.
 *
 * @todo revise blockContainer parameter!
 * @param {function} callback The function to be called on each block in the selection.
 * @param {jQuery} limitElement The element to stop searching for block elements at.
 * @param {undefined|Sring} blockContainer Thia parameter is unused for some reason.
 */
function selectionEachBlock(callback, limitElement, blockContainer) {
    // <strict>
    if (!$.isFunction(callback)) {
        handleInvalidArgumentError('Paramter 1 to selectionEachBlock is expected to be a function', callback);
        return;
    }
    if (!(limitElement instanceof jQuery)) {
        handleInvalidArgumentError('Paramter 2 to selectionEachBlock is expected a jQuery element', limitElement);
        return;
    }
    if (typeof blockContainer !== 'undefined' && typeof blockContainer !== 'string') {
        handleInvalidArgumentError('Paramter 3 to selectionEachBlock is expected be undefined or a string', blockContainer);
        return;
    }
    // </strict>
    selectionEachRange(function(range) {
        // Loop range parents until a block element is found, or the limit element is reached
        var startBlock = elementClosestBlock($(range.startContainer), limitElement),
            endBlock = elementClosestBlock($(range.endContainer), limitElement),
            blocks;
        if (!startBlock || !endBlock) {
            // Wrap the HTML inside the limit element
            callback(elementWrapInner(limitElement, blockContainer).get(0));
        } else {
            if (startBlock.is(endBlock)) {
                blocks = startBlock;
            } else if (startBlock && endBlock) {
                blocks = startBlock.nextUntil(endBlock).andSelf().add(endBlock);
            }
            for (var i = 0, l = blocks.length; i < l; i++) {
                callback(blocks[i]);
            }
        }
    });
}

/**
 * Add or removes a set of classes to the closest block elements in a selection.
 * If the `limitElement` is closer than a block element, then a new
 * `blockContainer` element wrapped around the selection.
 *
 * If any block in the selected text has not got the class applied to it, then
 * the class will be applied to all blocks.
 *
 * @todo revise blockContainer parameter!
 * @param {string[]} addClasses This is a set of classes to be added.
 * @param {string[]} removeClasses This is a set of classes to be removed.
 * @param {jQuery} limitElement The element to stop searching for block elements at.
 * @param {undefined|String} blockContainer Thia parameter is unused for some reason.
 */
function selectionToggleBlockClasses(addClasses, removeClasses, limitElement, blockContainer) {
    // <strict>
    if (!$.isArray(addClasses)) {
        handleInvalidArgumentError('Paramter 1 to selectionToggleBlockClasses is expected to be an array of classes', addClasses);
        return;
    }
    if (!$.isArray(removeClasses)) {
        handleInvalidArgumentError('Paramter 2 to selectionToggleBlockClasses is expected to be an array of classes', removeClasses);
        return;
    }
    if (!(limitElement instanceof jQuery)) {
        handleInvalidArgumentError('Paramter 3 to selectionToggleBlockClasses is expected a jQuery element', limitElement);
        return;
    }
    if (typeof blockContainer !== 'undefined' && typeof blockContainer !== 'string') {
        handleInvalidArgumentError('Paramter 4 to selectionToggleBlockClasses is expected be undefined or a string', blockContainer);
        return;
    }
    // </strict>

    var apply = false,
        blocks = new jQuery();

    selectionEachBlock(function(block) {
        blocks.push(block);
        if (!apply) {
            for (var i = 0, l = addClasses.length; i < l; i++) {
                if (!$(block).hasClass(addClasses[i])) {
                    apply = true;
                }
            }
        }
    }, limitElement, blockContainer);

    $(blocks).removeClass(removeClasses.join(' '));
    if (apply) {
        $(blocks).addClass(addClasses.join(' '));
    } else {
        $(blocks).removeClass(addClasses.join(' '));
    }
}

/**
 * Removes all ranges from a selection that are not contained within the
 * supplied element.
 *
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element The element to exclude the removal of ranges.
 * @param {RangySelection} [selection] The selection from which to remove the ranges.
 */
function selectionConstrain(node, selection) {
    // <strict>
    if (!typeIsNode(node)) {
        handleInvalidArgumentError('Parameter 1 to selectionConstrain must be a node', node);
        return;
    }
    // </strict>
    selection = selection || rangy.getSelection();
    var ranges = selection.getAllRanges(),
        newRanges = [];
    for (var i = 0, l = ranges.length; i < l; i++) {
        var newRange = ranges[i].cloneRange();
        if (ranges[i].startContainer !== node &&
                !nodeIsChildOf(ranges[i].startContainer, node)) {
            newRange.setStart(node, 0);
        }
        if (ranges[i].endContainer !== node &&
                !nodeIsChildOf(ranges[i].endContainer, node)) {
            newRange.setEnd(node, node.childNodes.length);
        }
        newRanges.push(newRange);
    }
    selection.setRanges(newRanges);
}

/**
 * Clears the formatting on a supplied selection.
 *
 * @param {Node} limitNode The containing element.
 * @param {RangySelection} [selection] The selection to have it's formatting cleared.
 */
function selectionClearFormatting(limitNode, selection) {
    // <strict>
    if (limitNode && !typeIsNode(limitNode)) {
        handleInvalidArgumentError('Parameter 1 to selectionClearFormatting must be a node', limitNode);
        return;
    }
    // </strict>

    limitNode = limitNode || document.body;
    selection = selection || rangy.getSelection();
    if (selectionExists()) {
        // Create a copy of the selection range to work with
        var range = selectionRange().cloneRange();

        // Get the selected content
        var content = range.extractContents();

        // Expand the range to the parent if there is no selected content
        // and the range's ancestor is not the limitNode
        if (fragmentToHtml(content) === '') {
            rangeSelectElementContent(range, range.commonAncestorContainer);
            selection.setSingleRange(range);
            content = range.extractContents();
        }

        content = $('<div/>').append(fragmentToHtml(content)).html().replace(/(<\/?.*?>)/gi, function(match) {
            if (match.match(/^<(img|object|param|embed|iframe)/) !== null) {
                return match;
            }
            return '';
        });

        // Get the containing element
        var parent = range.commonAncestorContainer;
        while (parent && parent.parentNode !== limitNode) {
            parent = parent.parentNode;
        }

        if (parent) {
            // Place the end of the range after the paragraph
            range.setEndAfter(parent);

            // Extract the contents of the paragraph after the caret into a fragment
            var contentAfterRangeStart = range.extractContents();

            // Collapse the range immediately after the paragraph
            range.collapseAfter(parent);

            // Insert the content
            range.insertNode(contentAfterRangeStart);

            // Move the caret to the insertion point
            range.collapseAfter(parent);
        }
        content = $.parseHTML(content);
        if (content !== null) {
            $(content.reverse()).each(function() {
                if ($(this).is('img')) {
                    range.insertNode($(this).removeAttr('width height class style').get(0));
                    return;
                }
                range.insertNode(this);
            });
        }
    }
}

/**
 * Replaces specified tags and classes on a selection.
 *
 * @todo check descriptions and types please
 * @param {String} tag1 This is the tag to appear on the selection at the end of the method.
 * @param {jQuery} class1 This is the class to appear on the selection at the end of the method.
 * @param {String} tag2 This is the current tag on the selection, which is to be replaced.
 * @param {jQuery} class2 This is the current class on the selection, which is to be replaced.
 */
function selectionInverseWrapWithTagClass(tag1, class1, tag2, class2) {
    selectionSave();
    // Assign a temporary tag name (to fool rangy)
    var id = 'domTools' + Math.ceil(Math.random() * 10000000);

    selectionEachRange(function(range) {
        var applier2 = rangy.createCssClassApplier(class2, {
            elementTagName: tag2
        });

        // Check if tag 2 is applied to range
        if (applier2.isAppliedToRange(range)) {
            // Remove tag 2 to range
            applier2.toggleSelection();
        } else {
            // Apply tag 1 to range
            rangy.createCssClassApplier(class1, {
                elementTagName: id
            }).toggleSelection();
        }
    }, null, this);

    // Replace the temporary tag with the correct tag
    $(id).each(function() {
        $(this).replaceWith($('<' + tag1 + '/>').addClass(class1).html($(this).html()));
    });

    selectionRestore();
}

/**
 * Expands the user selection to encase a whole word.
 */
function selectionExpandToWord() {
    var selection = window.getSelection(),
        range = selection.getRangeAt(0);
    if (!range ||
            range.startContainer !== range.endContainer ||
            range.startOffset !== range.endOffset) {
        return;
    }
    var start = range.startOffset,
        end = range.startOffset;
    while (range.startContainer.data[start - 1] &&
            !range.startContainer.data[start - 1].match(/\s/)) {
        start--;
    }
    while (range.startContainer.data[end] &&
            !range.startContainer.data[end].match(/\s/)) {
        end++;
    }
    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, end);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Expands the user selection to contain the supplied selector, stopping at the specified limit element.
 *
 * @param {jQuerySelector} selector The selector to expand the selection to.
 * @param {jQuerySelector} limit The element to stop at.
 * @param {boolean} outer If true, then the outer most matched element (by the
 *   selector) is wrapped. Otherwise the first matched element is wrapped.
 */
function selectionExpandTo(selector, limit, outer) {
    var ranges = rangy.getSelection().getAllRanges();
    for (var i = 0, l = ranges.length; i < l; i++) {
        // Start container
        var element = $(nodeFindParent(ranges[i].startContainer));
        if (outer || (!element.is(selector) && !element.is(limit))) {
            element = element.parentsUntil(limit, selector);
        }
        if (outer) {
            element = element.last();
        } else {
            element = element.first();
        }
        if (element.length === 1 && !element.is(limit)) {
            ranges[i].setStart(element[0], 0);
        }

        // End container
        element = $(nodeFindParent(ranges[i].endContainer));
        if (outer || (!element.is(selector) && !element.is(limit))) {
            element = element.parentsUntil(limit, selector);
        }
        if (outer) {
            element = element.last();
        } else {
            element = element.first();
        }
        if (element.length === 1 && !element.is(limit)) {
            ranges[i].setEnd(element[0], element[0].childNodes.length);
        }
    }
    rangy.getSelection().setRanges(ranges);
}

/**
 * Trims an entire selection as per rangeTrim.
 *
 * @see rangeTrim
 */
function selectionTrim() {
    if (selectionExists()) {
        var range = selectionRange();
        rangeTrim(range);
        selectionSet(range);
    }
}

/**
 * Finds the inner elements and the wrapping tags for a selector.
 *
 * @param {string} selector A jQuery selector to match the wrapping/inner element against.
 * @param {jQuery} limitElement The element to stop searching at.
 * @returns {jQuery}
 */
function selectionFindWrappingAndInnerElements(selector, limitElement) {
    var result = new jQuery();
    selectionEachRange(function(range) {
        var startNode = range.startContainer;
        while (startNode.nodeType === Node.TEXT_NODE) {
            startNode = startNode.parentNode;
        }

        var endNode = range.endContainer;
        while (endNode.nodeType === Node.TEXT_NODE) {
            endNode = endNode.parentNode;
        }

        var filter = function() {
            if (!limitElement.is(this)) {
                result.push(this);
            }
        };

        do {
            $(startNode).filter(selector).each(filter);

            if (!limitElement.is(startNode) && result.length === 0) {
                $(startNode).parentsUntil(limitElement, selector).each(filter);
            }

            $(startNode).find(selector).each(filter);

            if ($(endNode).is(startNode)) {
                break;
            }

            startNode = $(startNode).next();
        } while (startNode.length > 0 && $(startNode).prevAll().has(endNode).length === 0);
    });
    return result;
}

/**
 * Changes the tags on a selection.
 *
 * @param {String} changeTo The tag to be changed to.
 * @param {String} changeFrom The tag to be changed from.
 * @param {jQuery} limitElement The element to stop changing the tags at.
 */
function selectionChangeTags(changeTo, changeFrom, limitElement) {
    var elements = selectionFindWrappingAndInnerElements(changeFrom.join(','), limitElement);
    if (elements.length) {
        selectionSave();
        elementChangeTag(elements, changeTo);
        selectionRestore();
    } else {
        var limitNode = limitElement.get(0);
        if (limitNode.innerHTML.trim()) {
            selectionSave();
            limitNode.innerHTML = '<' + changeTo + '>' + limitNode.innerHTML + '</' + changeTo + '>';
            selectionRestore();
        } else {
            limitNode.innerHTML = '<' + changeTo + '>&nbsp;</' + changeTo + '>';
            selectionSelectInner(limitNode.childNodes[0]);
        }
    }
}

/**
 * Checks that the selecton only contains valid children.
 *
 * @param {String} selector A string containing a selector expression to match the current set of elements against.
 * @param {jQuery} limit The element to stop changing the tags at.
 * @returns {Boolean} True if the selection contains valid children.
 */
function selectionContains(selector, limit) {
    var result = true;
    selectionEachRange(function(range) {
        // Check if selection only contains valid children
        var children = $(range.commonAncestorContainer).find('*');
        if ($(range.commonAncestorContainer).parentsUntil(limit, selector).length === 0 &&
                (children.length === 0 || children.length !== children.filter(selector).length)) {
            result = false;
        }
    });
    return result;
}

function selectionDelete(selection) {
    selection = selection || rangy.getSelection();
    selection.deleteFromDocument();
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/selection.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/state.js
/**
 * @fileOverview Save state helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Saves the state of an element.
 * @param {jQuery} element The element to have its current state saved.
 * @returns {Object} The saved state of the element.
 */
function stateSave(element) {
    // <strict>
    if (!(element instanceof $)) {
        handleError("Element must be a jQuery instance when saving a state", element);
    }
    // </strict>

    var range = rangeGet();
    return {
        element: element.clone(true),
        ranges: range ? rangeSerialize(range, element.get(0)) : null
    };
}

/**
 * Restores an element from its saved state.
 *
 * @param {jQuery} element The element to have its state restored.
 * @param {jQuery} state The state to restore the element to.
 * @returns {Object} The restored element.
 */
function stateRestore(element, state) {
    // <strict>
    if (!(element instanceof $)) {
        handleError("Element must be a jQuery instance when restoring a state", element);
    }
    if (!(state.element instanceof $)) {
        handleError("Preview state element must be a jQuery instance when restoring a state", state.element);
    }
    // </strict>

    element.replaceWith(state.element);
    var ranges = null;
    try {
        if (state.ranges) {
            ranges = rangeDeserialize(state.ranges, state.element.get(0));
        }
    } catch (exception) {
        // <debug>
        handleError(exception);
        // </debug>
    }
    return {
        element: state.element,
        ranges: ranges
    };
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/state.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/string.js
/**
 * @fileOverview String helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Modification of strip_tags from PHP JS - http://phpjs.org/functions/strip_tags:535.
 * @param  {string} content HTML containing tags to be stripped
 * @param {Array} allowedTags Array of tags that should not be stripped
 * @return {string} HTML with all tags not present allowedTags array.
 */
function stringStripTags(content, allowedTags) {
    // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    allowed = [];
    for (var allowedTagsIndex = 0; allowedTagsIndex < allowedTags.length; allowedTagsIndex++) {
        if (allowedTags[allowedTagsIndex].match(/[a-z][a-z0-9]{0,}/g)) {
            allowed.push(allowedTags[allowedTagsIndex]);
        }
    }
    // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi,
        commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;

    return content.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf($1.toLowerCase()) > -1 ? $0 : '';
    });
}

/**
 * Checks if an html string is empty.
 *
 * @param {Element} element The element to be checked.
 * @returns {Element}
 */
function stringHtmlStringIsEmpty(html) {
    // <strict>
    if (!typeIsString(html)) {
        handleInvalidArgumentError('Parameter 1 to stringHtmlStringIsEmpty must be a string', html);
        return;
    }
    // </strict>
    return $($.parseHTML(html)).is(':empty');
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/string.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/style.js
/**
 * @fileOverview Style helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * @todo desc all
 * @param {jQuerySelector|jQuery|Element} element This is the element to have its styles swapped.
 * @param {array} newState The new state to be applied to the element.
 * @returns {array}
 */
function styleSwapState(element, newState) {
    var node = element.get(0),
        previousState = {};
    // Double loop because jQuery will automatically assign other style properties like 'margin-left' when setting 'margin'
    for (var key in newState) {
        previousState[key] = node.style[key];
    }
    for (key in newState) {
        element.css(key, newState[key]);
    }
    return previousState;
}

/**
 * @todo type for wrapper and inner and descriptions
 * @param {type} wrapper
 * @param {type} inner
 * @param {array} newState
 * @returns {unresolved}
 */
function styleSwapWithWrapper(wrapper, inner, newState) {
    var innerNode = inner.get(0),
        previousState = {};
    // Double loop because jQuery will automatically assign other style properties like 'margin-left' when setting 'margin'
    for (var key in newState) {
        previousState[key] = innerNode.style[key];
    }
    for (key in newState) {
        wrapper.css(key, inner.css(key));
        inner.css(key, newState[key]);
    }
    return previousState;
}

/**
 * @todo all
 * @param {jQuery} element
 * @param {array} state
 * @returns {undefined}
 */
function styleRestoreState(element, state) {
    for (var key in state) {
        element.css(key, state[key] || '');
    }
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/style.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/table.js
/**
 * @fileOverview Table helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen - david@panmedia.co.nz
 */

/**
 * Create and return a new table element with the supplied number of rows/columns.
 *
 * @public @static
 * @param {int} columns The number of columns to add to the table.
 * @param {int} rows The number of rows to add to the table.
 * @param [options] Extra options to apply.
 * @param [options.placeHolder=""] Place holder HTML to insert into each created cell.
 * @returns {HTMLTableElement}
 */
function tableCreate(columns, rows, options) {
    options = options || {};
    var table = document.createElement('table');
    while (rows--) {
        var row = table.insertRow(0);
        for (var i = 0; i < columns; i++) {
            var cell = row.insertCell(0);
            if (options.placeHolder) {
                cell.innerHTML = options.placeHolder;
            }
        }
    }
    return table;
}

/**
 * Adds a column to a table.
 *
 * @param {HTMLTableElement} table
 * @param {int[]} index Position to insert the column at, starting at 0.
 * @param [options] Extra options to apply.
 * @param [options.placeHolder=""] Place holder HTML to insert into each created cell.
 * @returns {HTMLTableCellElement[]} An array of cells added to the table.
 */
function tableInsertColumn(table, index, options) {
    return resizeTable(table, 0, 0, 1, index, options || {});
}
/**
 * Removes a column from a table.
 *
 * @param {HTMLTableElement} table
 * @param {int} index Position to remove the column at, starting at 0.
 */
function tableDeleteColumn(table, index) {
    resizeTable(table, 0, 0, -1, index);
}

/**
 * Adds a row to a table, and append as many cells as the longest row in the table.
 *
 * @param {HTMLTableElement} table
 * @param {int[]} index Position to insert the row at, starting at 0.
 * @param [options] Extra options to apply.
 * @param [options.placeHolder=""] Place holder HTML to insert into each created cell.
 * @returns {HTMLTableCellElement[]} An array of cells added to the table.
 */
function tableInsertRow(table, index, options) {
    var googTable = new GoogTable(table);
    return googTable.insertRow(index, options);
}

/**
 * Removes a row from a table.
 *
 * @param {HTMLTableElement} table The table to remove the row from.
 * @param {int} index Position to remove the row at, starting at 0.
 */
function tableDeleteRow(table, index) {
    resizeTable(table, -1, index, 0, 0);
}

/**
 * Return the x/y position of a table cell, taking into consideration the column/row span.
 *
 * @param {HTMLTableCellElement} cell The table cell to get the index for.
 * @returns {tableGetCellIndex.Anonym$0}
 */
function tableGetCellIndex(cell) {
    var x, y, tx, ty,
        matrix = [],
        rows = cell.parentNode.parentNode.parentNode.tBodies[0].rows;
    for (var r = 0; r < rows.length; r++) {
        y = rows[r].sectionRowIndex;
        y = r;
        for (var c = 0; c < rows[r].cells.length; c++) {
            x = c;
            while (matrix[y] && matrix[y][x]) {
                // Skip already occupied cells in current row
                x++;
            }
            for (tx = x; tx < x + (rows[r].cells[c].colSpan || 1); ++tx) {
                // Mark matrix elements occupied by current cell with true
                for (ty = y; ty < y + (rows[r].cells[c].rowSpan || 1); ++ty) {
                    if (!matrix[ty]) {
                        // Fill missing rows
                        matrix[ty] = [];
                    }
                    matrix[ty][tx] = true;
                }
            }
            if (cell === rows[r].cells[c]) {
                return {
                    x: x,
                    y: y
                };
            }
        }
    }
}

/**
 * Gets a table cell by a given index.
 *
 * @param {HTMLTableElement} table This is the table to get the cell from.
 * @param {int} index This is the index to find the cell.
 * @returns {HTMLTableCellElement|null} The cell at the specified index.
 */
function tableGetCellByIndex(table, index) {
    var rows = table.tBodies[0].rows;
    for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < rows[r].cells.length; c++) {
            var currentIndex = tableGetCellIndex(rows[r].cells[c]);
            if (currentIndex.x === index.x &&
                    currentIndex.y === index.y) {
                return rows[r].cells[c];
            }
        }
    }
    return null;
}

/**
 * Returns an array of cells found within the supplied indexes.
 *
 * @param {HTMLTableElement} table
 * @param {int} startIndex This is the index to start searching at.
 * @param {int} endIndex This is the index to stop searching at.
 * @returns {Array} An array of the cells in the range supplied.
 */
function tableCellsInRange(table, startIndex, endIndex) {
    var startX = Math.min(startIndex.x, endIndex.x),
        x = startX,
        y = Math.min(startIndex.y, endIndex.y),
        endX = Math.max(startIndex.x, endIndex.x),
        endY = Math.max(startIndex.y, endIndex.y),
        cells = [];
    while (y <= endY) {
        while (x <= endX) {
            var cell = tableGetCellByIndex(table, {
                x: x,
                y: y
            });
            if (cell !== null) {
                cells.push(cell);
            }
            x++;
        }
        x = startX;
        y++;
    }
    return cells;
}

/**
 * Checks if the cells selected can be merged.
 *
 * @param {HTMLTableElement} table The table to check the selection with.
 * @param {int} startX Selection's start x position.
 * @param {int} startY Selection's start y position.
 * @param {int} endX Selection's end x position.
 * @param {int} endY Selection's end y position.
 */
function tableCanMergeCells(table, startX, startY, endX, endY) {
}

/**
 * Merges the selected cells of a table.
 *
 * @param {HTMLTableElement} table This is the table that is going to have cells merged.
 * @param {int} startX This is the X coordinate to start merging the cells at.
 * @param {int} startY This is the Y coordinate to start merging the cells at.
 * @param {int} endX This is the X coordinate to stop merging the cells at.
 * @param {int} endY This is the Y coordinate to stop merging the cells at.
 */
function tableMergeCells(table, startX, startY, endX, endY) {
    var googTable = new GoogTable(table);
    googTable.mergeCells(startX, startY, endX, endY);
}

/**
 * Checks if the cell at the given index can be split.
 *
 * @param {HTMLTableElement} table Table to check the seleciton with.
 * @param {int} x The X coordinate of the cell to be checked.
 * @param {int} y Ths Y coordinate of the cell to be checked.
 */
function tableCanSplitCells(table, x, y) {
}

/**
 * Splits the selected cell of a table.
 *
 * @param {HTMLTableElement} table The table to find the cell to be split on.
 * @param {int} x The X coordinate of the cell to be split.
 * @param {int} y The Y coordinate of the cell to be split.
 */
function tableSplitCells(table, x, y) {
    var googTable = new GoogTable(table);
    googTable.splitCell(x, y);
}


function tableIsEmpty(table) {
    for (var i = 0, l = table.rows.length; i < l; i++) {
        if (table.rows[i].cells.length > 0) {
            return false;
        }
    }
    return true;
};
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/table.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/template.js
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/template.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/types.js
/**
 * @fileOverview Type checking functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author Michael Robinson michael@panmedia.co.nz
 * @author David Neilsen david@panmedia.co.nz
 */

/**
 * Determines whether object is a rangy range.
 *
 * @param {mixed} object The object to be tested.
 * @returns {Boolean} True if the object is a rangy range.
 */
function typeIsRange(object) {
    return object instanceof rangy.WrappedRange;
}

/**
 * Determines whether object is a rangy selection.
 *
 * @param {mixed} object The object to be tested.
 * @returns {Boolean} True if the object is a rangy selection.
 */
function typeIsSelection(object) {
    return object instanceof rangy.WrappedSelection;
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/tools/types.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/adapters/jquery-ui.js
/**
 * @fileOverview jQuery UI helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

/**
 * Wrap the jQuery UI button function.
 *
 * @param {Element|Node|selector} element
 * @param {Object|null} options The options relating to the creation of the button.
 * @returns {Element} The modified element.
 */
function aButton(element, options) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButton is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).button(options);
}

/**
 * Wrap the jQuery UI button's set label function.
 *
 * @param {Element|Node|selector} element
 * @param {String} text The text for the label.
 * @returns {Element} The labelled button.
 */
function aButtonSetLabel(element, text) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonSetLabel is expected to be a jQuery compatible object', element);
    }
    // </strict>

    $(element).button('option', 'text', true);
    return $(element).button('option', 'label', text);
}

/**
 * Wrap the jQuery UI button's set icon function.
 *
 * @param {Element|Node|selector} element
 * @param {String} icon The icon name to be added to the button, e.g. 'ui-icon-disk'
 * @returns {Element} The modified button.
 */
function aButtonSetIcon(element, icon) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonSetIcon is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).button('option', 'icons', {
        primary: icon
    });
}

/**
 * Wrap the jQuery UI button's enable function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element} The enabled button.
 */
function aButtonEnable(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonEnable is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).button('option', 'disabled', false);
}

function aButtonIsEnabled(element) {
    return !$(element).is('.ui-state-disabled');
}

/**
 * Wrap the jQuery UI button's disable function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element} The disabled button.
 */
function aButtonDisable(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonDisable is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).button('option', 'disabled', true);
}

/**
 * Wrap the jQuery UI button's add class function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element} The highlighted button.
 */
function aButtonActive(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonActive is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).addClass('ui-state-highlight');
}

/**
 * Wrap the jQuery UI button's remove class function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element} The button back in its normal state.
 */
function aButtonInactive(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aButtonInactive is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).removeClass('ui-state-highlight');
}

/**
 * Wrap the jQuery UI button's initialise menu function.
 *
 * @param {Element|Node|selector} element
 * @param {Object|null} options The set of options for menu creation.
 * @returns {Element} The menu.
 */
function aMenu(element, options) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aMenu is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).menu(options);
}

/**
 * Initialises a dialog with the given element.
 *
 * @param {Element|Node|selector} element
 * @param {Object|null} options The set of options for the menu.
 * @returns {Element} A dialog.
 */
function aDialog(element, options) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aDialog is expected to be a jQuery compatible object', element);
    }
    // </strict>

    options.dialogClass = typeof options.dialogClass !== 'undefined' ? options.dialogClass + ' ui-dialog-fixed' : 'ui-dialog-fixed';
    var dialog = $(element).dialog(options);
    dialog.parent().css({
        top: (parseInt(dialog.parent().css('top')) || 0) - $(window).scrollTop()
    });
    dialog.dialog("option", "position", 'center');
    return dialog;
}

/**
 * Wrap the jQuery UI open dialog function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element}
 */
function aDialogOpen(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aDialogOpen is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).dialog('open');
}

/**
 * Wrap the jQuery UI close dialog function.
 *
 * @param {Element|Node|selector} element
 * @returns {Element}
 */
function aDialogClose(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aDialogClose is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).dialog('close');
}

function aDialogRemove(element) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aDialogClose is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).dialog('destroy').remove();
}

/**
 * Wrap the jQuery UI tabs function.
 *
 * @param  {Element|Node|selector} element
 * @param  {Object|null} options
 * @returns {Element}
 */
function aTabs(element, options) {
    // <strict>
    if (!typeIsJQueryCompatible(element)) {
        handleInvalidArgumentError('Parameter 1 to aTabs is expected to be a jQuery compatible object', element);
    }
    // </strict>

    return $(element).tabs(options);
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/adapters/jquery-ui.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/adapters/pnotify.js
function aNotify(options) {
    if (options.type == 'success') {
        options.state = 'confirmation'
    }
    $.pnotify($.extend({
        type: 'success',
        styling: 'jqueryui',
        history: false
    }, options));
}
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-common/adapters/pnotify.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/init.js
var $ = jQuery;

$(function() {
    // Initialise rangy
    if (!rangy.initialized) {
        rangy.init();
    }

    // Add helper method to rangy
    if (!$.isFunction(rangy.rangePrototype.insertNodeAtEnd)) {
        rangy.rangePrototype.insertNodeAtEnd = function(node) {
            var range = this.cloneRange();
            range.collapse(false);
            range.insertNode(node);
            range.detach();
            this.setEndAfter(node);
        };
    }
});

// Select menu close event (triggered when clicked off)
$('html').click(function(event) {
    $('.ui-editor-selectmenu-visible')
        .removeClass('ui-editor-selectmenu-visible');
});
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/init.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/support.js
var supported, ios, hotkeys, firefox, ie;

function isSupported() {
    if (supported === undefined) {
        supported = true;

        // <ios>
        ios = /(iPhone|iPod|iPad).*AppleWebKit/i.test(navigator.userAgent);
        if (ios) {
            $('html').addClass('raptor-ios');

            // Fixed position hack
            if (ios) {
                $(document).on('scroll', function(){
                    setInterval(function() {
                        $('body').css('height', '+=1').css('height', '-=1');
                    }, 0);
                });
            }
        }
        // </ios>

        firefox = /Firefox/i.test(navigator.userAgent);
        if (firefox) {
            $('html').addClass('raptor-ff');
        }

        // <ie>
        /**
         * Returns the version of Internet Explorer or a -1 (indicating the use of another browser).
         * http://obvcode.blogspot.co.nz/2007/11/easiest-way-to-check-ie-version-with.html
         */
        var ieVersion = (function() {
            var version = -1;
            if (navigator.appVersion.indexOf("MSIE") != -1) {
                version = parseFloat(navigator.appVersion.split("MSIE")[1]);
            }
            return version;
        })();

        ie = ieVersion !== -1;
        if (ie && ieVersion < 9) {
            supported = false;

            // Create message modal
            $(function() {
                var message = $('<div/>')
                    .addClass('raptor-unsupported')
                    .html(
                        '<div class="raptor-unsupported-overlay"></div>' +
                        '<div class="raptor-unsupported-content">' +
                        '    It has been detected that you a using a browser that is not supported by Raptor, please' +
                        '    use one of the following browsers:' +
                        '    <ul>' +
                        '        <li><a href="http://www.google.com/chrome">Google Chrome</a></li>' +
                        '        <li><a href="http://www.firefox.com">Mozilla Firefox</a></li>' +
                        '        <li><a href="http://windows.microsoft.com/ie">Internet Explorer</a></li>' +
                        '    </ul>' +
                        '    <div class="raptor-unsupported-input">' +
                        '        <button class="raptor-unsupported-close">Close</button>' +
                        '        <input name="raptor-unsupported-show" type="checkbox" />' +
                        '        <label>Don\'t show this message again</label>' +
                        '    </div>' +
                        '<div>'
                    )
                    .appendTo('body');

                /**
                 * Sets the z-index CSS property on an element to 1 above all its sibling elements.
                 *
                 * @param {jQuery} element The jQuery element to have it's z index increased.
                 */
                var elementBringToTop = function(element) {
                    var zIndex = 1;
                    element.siblings().each(function() {
                        var z = $(this).css('z-index');
                        if (!isNaN(z) && z > zIndex) {
                            zIndex = z + 1;
                        }
                    });
                    element.css('z-index', zIndex);
                }
                elementBringToTop(message);

                // Close event
                message.find('.raptor-unsupported-close').click(function() {
                    message.remove();
                });
            });
        }
        // </ie>

        hotkeys = jQuery.hotkeys !== undefined;
    }
    return supported;
}

// <ie>

/**
 * Object.create polyfill
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 */
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

/**
 * Node.TEXT_NODE polyfill
 */
if (typeof Node === 'undefined') {
    Node = {
        TEXT_NODE: 3
    };
}

/**
 * String.trim polyfill
 * https://gist.github.com/eliperelman/1035982
 */
''.trim || (String.prototype.trim = // Use the native method if available, otherwise define a polyfill:
    function () { // trim returns a new string (which replace supports)
        return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g,'') // trim the left and right sides of the string
    });

// </ie>

// <strict>

// Ensure jQuery has been included
if (typeof jQuery === 'undefined') handleError('jQuery is required');

// Ensure jQuery UI has been included
else if (!jQuery.ui) handleError('jQuery UI is required');

// Ensure dialog has been included
else if (!jQuery.ui.dialog) handleError('jQuery UI Dialog is required.');

// Ensure dialog has been included
else if (!jQuery.ui.position) handleError('jQuery UI Position is required.');

// Ensure rangy has been included
if (typeof rangy === 'undefined') handleError('Rangy is required. This library should have been included with the file you downloaded. If not, acquire it here: http://code.google.com/p/rangy/"');


function versionCompare(v1, v2) {
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length == i) {
            return v1;
        }
        var v1int = parseInt(v1parts[i]);
        var v2int = parseInt(v2parts[i]);

        if (v1int == v2int) {
            continue;
        }
        else if (v1int > v2int) {
            return v1;
        }
        else {
            return v2;
        }
    }

    if (v1parts.length != v2parts.length) {
        return v2;
    }

    return null;
}
var jQueryVersion = versionCompare('1.9.0', jQuery.fn.jquery);
if (jQueryVersion === '1.9.0') {
    handleError('jQuery version should be at least 1.9.0');
}
var jQueryUIVersion = versionCompare('1.10.0', jQuery.ui.version);
if (jQueryUIVersion === '1.10.0') {
    handleError('jQuery UI version should be at least 1.9.0');
}
// </strict>;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/support.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/raptor.js
/**
 * @class Raptor
 */
var Raptor =  {

    globalDefaults: {},
    defaults: {},

    /** @property {boolean} enableHotkeys True to enable hotkeys */
    enableHotkeys: true,

    /** @property {Object} hotkeys Custom hotkeys */
    hotkeys: {},

    /**
     * Plugins added via Raptor.registerPlugin
     * @property {Object} plugins
     */
    plugins: {},

    /**
     * UI added via Raptor.registerUi
     * @property {Object} ui
     */
    ui: {},

    /**
     * Layouts added via Raptor.registerLayout
     * @property {Object} layouts
     */
    layouts: {},

    /**
     * Presets added via Raptor.registerPreset
     * @property {Object} presets
     */
    presets: {},

    hoverPanels: {},

    /**
     * @property {Raptor[]} instances
     */
    instances: [],

    /**
     * @returns {Raptor[]}
     */
    getInstances: function() {
        return this.instances;
    },

    eachInstance: function(callback) {
        for (var i = 0; i < this.instances.length; i++) {
            callback.call(this.instances[i], this.instances[i]);
        }
    },

    /*========================================================================*\
     * Templates
    \*========================================================================*/
    /**
     * @property {String} urlPrefix
     */
    urlPrefix: '/raptor/',

    /**
     * @param {String} name
     * @returns {String}
     */
    getTemplate: function(name, urlPrefix) {
        var template;
        if (!this.templates[name]) {
            // Parse the URL
            var url = urlPrefix || this.urlPrefix;
            var split = name.split('.');
            if (split.length === 1) {
                // URL is for and editor core template
                url += 'templates/' + split[0] + '.html';
            } else {
                // URL is for a plugin template
                url += 'plugins/' + split[0] + '/templates/' + split.splice(1).join('/') + '.html';
            }

            // Request the template
            $.ajax({
                url: url,
                type: 'GET',
                async: false,
                // <debug>
                cache: false,
                // </debug>
                // 15 seconds
                timeout: 15000,
                error: function() {
                    template = null;
                },
                success: function(data) {
                    template = data;
                }
            });
            // Cache the template
            this.templates[name] = template;
        } else {
            template = this.templates[name];
        }
        return template;
    },

    /*========================================================================*\
     * Helpers
    \*========================================================================*/

    /**
     * @returns {boolean}
     */
    isDirty: function() {
        var instances = this.getInstances();
        for (var i = 0; i < instances.length; i++) {
            if (instances[i].isDirty()) return true;
        }
        return false;
    },

    /**
     *
     */
    unloadWarning: function() {
        var instances = this.getInstances();
        for (var i = 0; i < instances.length; i++) {
            if (instances[i].isDirty() &&
                    instances[i].isEditing() &&
                    instances[i].options.unloadWarning) {
                return tr('navigateAway');
            }
        }
    },

    /*========================================================================*\
     * Plugins and UI
    \*========================================================================*/

    /**
     * Registers a new UI component, overriding any previous UI components registered with the same name.
     *
     * @param {String} name
     * @param {Object} ui
     */
    registerUi: function(ui) {
        // <strict>
        if (typeof ui !== 'object') {
            handleError(tr('errorUINotObject', {
                ui: ui
            }));
            return;
        } else if (typeof ui.name !== 'string') {
            handleError(tr('errorUINoName', {
                ui: ui
            }));
            return;
        } else if (this.ui[ui.name]) {
            handleError(tr('errorUIOverride', {
                name: ui.name
            }));
        }
        // </strict>
        this.ui[ui.name] = ui;
    },

    /**
     * Registers a new layout, overriding any previous layout registered with the same name.
     *
     * @param {String} name
     * @param {Object} layout
     */
    registerLayout: function(layout) {
        // <strict>
        if (typeof layout !== 'object') {
            handleError('Layout "' + layout + '" is invalid (must be an object)');
            return;
        } else if (typeof layout.name !== 'string') {
            handleError('Layout "'+ layout + '" is invalid (must have a name property)');
            return;
        } else if (this.layouts[layout.name]) {
            handleError('Layout "' + layout.name + '" has already been registered, and will be overwritten');
        }
        // </strict>

        this.layouts[layout.name] = layout;
    },

    registerPlugin: function(plugin) {
        // <strict>
        if (typeof plugin !== 'object') {
            handleError('Plugin "' + plugin + '" is invalid (must be an object)');
            return;
        } else if (typeof plugin.name !== 'string') {
            handleError('Plugin "'+ plugin + '" is invalid (must have a name property)');
            return;
        } else if (this.plugins[plugin.name]) {
            handleError('Plugin "' + plugin.name + '" has already been registered, and will be overwritten');
        }
        // </strict>

        this.plugins[plugin.name] = plugin;
    },

    registerPreset: function(preset, setDefault) {
        // <strict>
        if (typeof preset !== 'object') {
            handleError('Preset "' + preset + '" is invalid (must be an object)');
            return;
        } else if (typeof preset.name !== 'string') {
            handleError('Preset "'+ preset + '" is invalid (must have a name property)');
            return;
        } else if (this.presets[preset.name]) {
            handleError('Preset "' + preset.name + '" has already been registered, and will be overwritten');
        }
        // </strict>

        this.presets[preset.name] = preset;
        if (setDefault) {
            this.defaults = preset;
        }
    },

    /*========================================================================*\
     * Persistance
    \*========================================================================*/
    /**
     * @param {String} key
     * @param {mixed} value
     * @param {String} namespace
     */
    persist: function(key, value, namespace) {
        key = namespace ? namespace + '.' + key : key;
        if (value === undefined) {
            return persistGet(key);
        }
        return persistSet(key, value);
    }

};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/raptor.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/raptor-widget.js
/**
 *
 * @author David Neilsen - david@panmedia.co.nz
 * @author Michael Robinson - michael@panmedia.co.nz
 * @version 0.1
 * @requires jQuery
 * @requires jQuery UI
 * @requires Rangy
 */

/**
 * Set to true when raptor is reloading the page after it has disabled editing.
 *
 * @type Boolean
 */
var disabledReloading = false;

/**
 * @class
 */
var RaptorWidget = {

    /**
     * @constructs RaptorWidget
     */
    _init: function() {
        // Prevent double initialisation
        if (this.element.attr('data-raptor-initialised')) {
            // <debug>
            if (debugLevel >= MID) {
                debug('Raptor already initialised, attempted to reinitialise on: ', this.element);
            }
            // </debug>
            return;
        }
        this.element.attr('data-raptor-initialised', true);

        // Add the editor instance to the global list of instances
        if ($.inArray(this, Raptor.instances) === -1) {
            Raptor.instances.push(this);
        }

        var currentInstance = this;

        // <strict>
        // Check for nested editors
        Raptor.eachInstance(function(instance) {
            if (currentInstance != instance &&
                    currentInstance.element.closest(instance.element).length) {
                handleError('Nesting editors is unsupported', currentInstance.element, instance.element);
            }
        });
        // </strict>

        // Set the initial locale
        var locale = this.persist('locale') || this.options.initialLocale;
        if (locale) {
            currentLocale = locale;
        }

        var options = this.options;
        if (this.options.preset) {
            this.options = $.extend(true, {}, Raptor.globalDefaults, Raptor.presets[this.options.preset], this.options);
        } else {
            this.options = $.extend(true, {}, Raptor.globalDefaults, Raptor.defaults, this.options);
        }
        if (options.layouts && options.layouts.toolbar && options.layouts.toolbar.uiOrder) {
            this.options.layouts.toolbar.uiOrder = options.layouts.toolbar.uiOrder;
        }

        // Give the element a unique ID
        if (!this.element.attr('id')) {
            this.element.attr('id', elementUniqueId());
        }

        // Initialise properties
        this.ready = false;
        this.events = {};
        this.plugins = {};
        this.layouts = {};
        this.templates = $.extend({}, Raptor.templates);
        this.target = this.element;
        this.layout = null;
        this.previewState = null;
        this.pausedState = null;
        this.pausedScrollX = null;
        this.pausedScrollY = null;

        // True if editing is enabled
        this.enabled = false;

        // True if editing is enabled at least once
        this.initialised = false;

        // List of UI objects bound to the editor
        this.uiObjects = {};

        // List of hotkeys bound to the editor
        this.hotkeys = {};
        this.hotkeysSuspended = false;

        // If hotkeys are enabled, register any custom hotkeys provided by the user
        if (this.options.enableHotkeys) {
            this.registerHotkey(this.hotkeys);
        }

        // Bind default events
        for (var name in this.options.bind) {
            this.bind(name, this.options.bind[name]);
        }

        // Undo stack, redo pointer
        this.history = [];
        this.present = 0;
        this.historyEnabled = true;

        // Check for browser support
        if (!isSupported()) {
            // @todo If element isn't a textarea, replace it with one
            return;
        }

        // Store the original HTML
        this.setOriginalHtml(this.element.is(':input') ? this.element.val() : this.element.html());
        this.historyPush(this.getOriginalHtml());

        // Replace textareas/inputs with a div
        if (this.element.is(':input')) {
            this.replaceOriginal();
        }

        // Load plugins
        this.loadPlugins();

        // Stores if the current state of the content is clean
        this.dirty = false;

        // Stores the previous state of the content
        this.previousContent = null;

        // Stores the previous selection
        this.previousSelection = null;

        this.getElement().addClass('raptor-editable-block');

        this.loadLayouts();

        // Fire the ready event
        this.ready = true;
        this.fire('ready');

        // Automatically enable the editor if autoEnable is true
        if (this.options.autoEnable) {
            $(function() {
                currentInstance.enableEditing();
            });
        }
    },

    /*========================================================================*\
     * Core functions
    \*========================================================================*/

    /**
     * Attaches the editor's internal events.
     *
     * @fires RaptorWidget#resize
     */
    attach: function() {
        this.bind('change', this.historyPush);

        this.getElement().on('click.raptor', 'img', function(event) {
            selectionSelectOuter(event.target);
            this.checkSelectionChange();
        }.bind(this));
        this.getElement().on('focus.raptor', this.showLayout.bind(this));
        this.target.on('mouseup.raptor', this.checkSelectionChange.bind(this));
        this.target.on('input.raptor keyup.raptor mouseup.raptor', this.checkChangeDelayed.bind(this));

        // Unload warning
        $(window).bind('beforeunload', Raptor.unloadWarning.bind(Raptor));

        // Trigger editor resize when window is resized
        var editor = this;
        $(window).resize(function(event) {
            editor.fire('resize');
        });
    },

    /**
     * Detaches the editor's internal events.
     */
    detach: function() {
        this.unbind('change');
        this.getElement().off('click.raptor', 'img');
        this.getElement().off('focus.raptor');
        this.getElement().blur();

        this.target.off('mouseup.raptor');
        this.target.off('keyup.raptor');
    },

    /**
     * Reinitialises the editor, unbinding all events, destroys all UI and plugins
     * then recreates them.
     */
    localeChange: function() {
        if (!this.ready) {
            // If the edit is still initialising, wait until its ready
            var localeChange;
            localeChange = function() {
                // Prevent reinit getting called twice
                this.unbind('ready', localeChange);
                this.localeChange();
            };
            this.bind('ready', localeChange);
            return;
        }

        this.actionPreviewRestore();
        var visibleLayouts = [];
        for (var name in this.layouts) {
            if (this.layouts[name].isVisible()) {
                visibleLayouts.push(name);
            }
        }
        this.layoutsDestruct();
        this.events = {};
        this.plugins = {};
        this.uiObjects = {};
        this.hotkeys = {};
        this.loadPlugins();
        this.loadLayouts();
        for (var i = 0; i < visibleLayouts.length; i++) {
            this.layouts[visibleLayouts[i]].show();
        }
        this.checkSelectionChange();
    },

    /**
     * Restore focus to the element being edited.
     */
    restoreFocus: function() {
        this.getElement().focus();
    },

    /**
     * Returns the current content editable element, which will be either the
     * orignal element, or the div the orignal element was replaced with.
     * @returns {jQuery} The current content editable element
     */
    getElement: function() {
        return this.target;
    },

    getNode: function() {
        return this.target[0];
    },

    /**
     *
     */
    getOriginalElement: function() {
        return this.element;
    },

    /**
     * Replaces the original element with a content editable div. Typically used
     * to replace a textarea.
     */
    replaceOriginal: function() {
        if (!this.target.is(':input')) return;

        // Create the replacement div
        var target = $('<div/>')
            // Set the HTML of the div to the HTML of the original element, or if the original element was an input, use its value instead
            .html(this.element.val())
            // Insert the div before the original element
            .insertBefore(this.element)
            // Give the div a unique ID
            .attr('id', elementUniqueId())
            // Copy the original elements class(es) to the replacement div
            .addClass(this.element.attr('class'))
            // Add custom classes
            .addClass(this.options.classes);

        var style = elementGetStyles(this.element);
        for (var i = 0; i < this.options.replaceStyle.length; i++) {
            target.css(this.options.replaceStyle[i], style[this.options.replaceStyle[i]]);
        }

        this.element.hide();
        this.bind('change', function() {
            if (this.getOriginalElement().is(':input')) {
                this.getOriginalElement().val(this.getHtml()).trigger('input');
            } else {
                this.getOriginalElement().html(this.getHtml());
            }
        });

        this.target = target;
    },

    checkSelectionChange: function() {
        // Check if the caret has changed position
        var currentSelection = rangy.serializeSelection(null, false);
        if (this.previousSelection !== currentSelection) {
            this.fire('selectionChange');
        }
        this.previousSelection = currentSelection;
    },

    checkChangeTimer: null,
    checkChangeCount: 0,
    checkChangeDelayed: function() {
        if (this.checkChangeTimer !== null) {
            clearTimeout(this.checkChangeTimer);
            this.checkChangeTimer = null;
        }
        if (this.checkChangeCount++ < 10) {
            this.checkChangeTimer = setTimeout(this.checkChange.bind(this), 200);
        } else {
            this.checkChange();
        }
    },

    /**
     * Determine whether the editing element's content has been changed.
     */
    checkChange: function() {
        this.checkChangeCount = 0;

        // Get the current content
        var currentHtml = this.getHtml();

        // Check if the dirty state has changed
        var wasDirty = this.dirty;

        // Check if the current content is different from the original content
        this.dirty = this.originalHtml !== currentHtml;

        // If the current content has changed since the last check, fire the change event
        if (this.previousHtml !== currentHtml) {
            this.previousHtml = currentHtml;
            this.fire('change', [currentHtml]);

            // If the content was changed to its original state, fire the cleaned event
            if (wasDirty !== this.dirty) {
                if (this.dirty) {
                    this.fire('dirty');
                } else {
                    this.fire('cleaned');
                }
            }

            this.checkSelectionChange();
        }
    },

    change: function() {
        this.fire('change', [
            this.getHtml()
        ]);
    },

    /*========================================================================*\
     * Destructor
    \*========================================================================*/

    /**
     * Hides the toolbar, disables editing, and fires the destroy event, and unbinds any events.
     * @public
     */
    destruct: function(reinitialising) {
        this.disableEditing();

        // Trigger destroy event, for plugins to remove them selves
        this.fire('destroy');

        // Remove all event bindings
        this.events = {};

        // Unbind all events
        this.getElement().off('.raptor');

        if (this.getOriginalElement().is(':input')) {
            this.target.remove();
            this.target = null;
            this.element.show();
        }

        this.layoutsDestruct();
    },

    /**
     * Runs destruct, then calls the UI widget destroy function.
     * @see $.
     */
//    destroy: function() {
//        this.destruct();
//        $.Widget.prototype.destroy.call(this);
//    },

    /*========================================================================*\
     * Preview functions
    \*========================================================================*/

    actionPreview: function(action) {
        this.actionPreviewRestore();
        try {
            var ranges = this.fire('selection-customise');
            if (ranges.length > 0) {
                this.previewState = actionPreview(this.previewState, this.target, function() {
                    for (var i = 0, l = ranges.length; i < l; i++) {
                        rangy.getSelection().setSingleRange(ranges[i]);
                        this.selectionConstrain();
                        action();
                    }
                }.bind(this));
            } else {
                this.selectionConstrain();
                this.previewState = actionPreview(this.previewState, this.target, action);
            }
            this.checkSelectionChange();
        } catch (exception) {
            // <strict>
            handleError(exception);
            // </strict>
        }
    },

    actionPreviewRestore: function() {
        if (this.previewState) {
            this.target = actionPreviewRestore(this.previewState, this.target);
            this.previewState = null;
            this.checkSelectionChange();
        }
    },

    actionApply: function(action) {
        this.actionPreviewRestore();
        var state = this.stateSave();
        try {
            var ranges = this.fire('selection-customise');
            if (ranges.length > 0) {
                actionApply(function() {
                    for (var i = 0, l = ranges.length; i < l; i++) {
                        rangy.getSelection().setSingleRange(ranges[i]);
                        this.selectionConstrain();
                        actionApply(action, this.history);
                    }
                }.bind(this), this.history);
            } else {
                this.selectionConstrain();
                actionApply(action, this.history);
            }
            this.checkChange();
        } catch (exception) {
            this.stateRestore(state);
            // <strict>
            handleError(exception);
            // </strict>
        }
    },

    actionUndo: function() { },

    actionRedo: function() { },

    stateSave: function() {
        this.selectionConstrain();
        return stateSave(this.target);
    },

    stateRestore: function(state) {
        // if (!this.isEditing()) {
        //     return;
        // }
        var restoredState = stateRestore(this.target, state),
            selection = rangy.getSelection();
        this.target = restoredState.element;
        if (restoredState.ranges !== null) {
            selection.setRanges(restoredState.ranges);
            selection.refresh();
        }
    },

    selectionConstrain: function() {
        selectionConstrain(this.target[0]);
    },

    pause: function() {
        if (!this.pausedState) {
            this.pausedState = this.stateSave()
            this.suspendHotkeys();
            // <jquery-ui>
            // Hack to fix when a dialog is closed, the editable element is focused, and the scroll jumps to the top
            this.pausedScrollX = window.scrollX;
            this.pausedScrollY = window.scrollY;
            // </jquery-ui>
        }
    },

    resume: function() {
        if (this.pausedState) {
            this.stateRestore(this.pausedState);
            this.pausedState = null;
            this.resumeHotkeys();
            this.restoreFocus();
            // <jquery-ui>
            window.scrollTo(this.pausedScrollX, this.pausedScrollY);
            // </jquery-ui>
        }
    },

    /*========================================================================*\
     * Persistance Functions
    \*========================================================================*/

    /**
     * @param {String} key
     * @param {mixed} [value]
     * @returns {mixed}
     */
    persist: function(key, value) {
        if (!this.options.persistence) return null;
        return Raptor.persist(key, value, this.options.namespace);
    },

    /*========================================================================*\
     * Other Functions
    \*========================================================================*/

    /**
     *
     */
    enableEditing: function() {
        if (!this.enabled) {
            this.fire('enabling');

            // Attach core events
            this.attach();

            this.enabled = true;

            this.getElement()
                .addClass(this.options.baseClass + '-editing')
                .addClass(this.options.classes);

            if (this.options.partialEdit) {
                this.getElement().find(this.options.partialEdit).prop('contenteditable', true);
            } else {
                this.getElement().prop('contenteditable', true);
            }

            if (!this.initialised) {
                this.initialised = true;
//                try {
//                    document.execCommand('enableInlineTableEditing', false, false);
//                    document.execCommand('styleWithCSS', true, true);
//                } catch (error) {
//                    // <strict>
//                    handleError(error);
//                    // </strict>
//                }

                for (var name in this.plugins) {
                    this.plugins[name].enable();
                }

                this.bindHotkeys();

                this.getElement().closest('form').on('submit.raptor', function() {
                    clean(this.getElement());
                    this.fire('change', [this.getHtml()]);
                }.bind(this));
            }

            clean(this.getElement());
            this.fire('enabled');
            this.showLayout();

            var selectNode = this.options.partialEdit ? this.getElement().find('[contenteditable]')[0] : this.getNode();
            switch (this.options.autoSelect) {
                case 'all': {
                    selectionSelectInner(selectNode);
                    break;
                }
                case 'start': {
                    var selectInnerNode = $(selectNode).find('*:first')[0];
                    if (!selectInnerNode) {
                        selectionSelectInner(selectNode);
                        break;
                    }
                    var range = rangy.createRange();
                    range.setStartBefore(selectInnerNode);
                    range.setEndBefore(selectInnerNode);
                    selectionSet(range);
                    break;
                }
                case 'end': {
                    var selectInnerNode = $(selectNode).find('*:last')[0];
                    if (!selectInnerNode) {
                        selectionSelectInner(selectNode);
                        break;
                    }
                    selectionSelectInner(selectInnerNode);
                    var range = rangy.createRange();
                    range.setStartAfter(selectInnerNode);
                    range.setEndAfter(selectInnerNode);
                    selectionSet(range);
                    break;
                }
            }
        }
    },

    /**
     *
     */
    disableEditing: function() {
        if (this.enabled) {
            this.detach();
            this.enabled = false;
            this.getElement()
                .prop('contenteditable', false)
                .removeClass(this.options.baseClass + '-editing')
                .removeClass(this.options.classes);
            rangy.getSelection().removeAllRanges();
            this.fire('disabled');
            if (this.options.reloadOnDisable && !disabledReloading) {
                disabledReloading = true;
                window.location.reload();
            }
        }
    },

    cancelEditing: function() {
        this.unify(function(raptor) {
            raptor.stopEditing();
        });
    },

    stopEditing: function() {
        this.fire('cancel');
        if (!this.options.reloadOnDisable) {
            this.resetHtml();
        }
        this.disableEditing();
        this.dirty = false;
        selectionDestroy();
    },

    /**
     *
     * @returns {boolean}
     */
    isEditing: function() {
        return this.enabled;
    },

    /**
     * @param {jQuerySelector|jQuery|Element} element
     * @returns {boolean}
     */
    isRoot: function(element) {
        return this.getElement()[0] === $(element)[0];
    },

    /**
     * @param {function} callback
     * @param {boolean} [callSelf]
     */
    unify: function(callback, callSelf) {
        if (callSelf !== false) {
            callback(this);
        }
        if (this.options.unify) {
            var currentInstance = this;
            Raptor.eachInstance(function(instance) {
                if (instance === currentInstance) {
                    return;
                }
                if (instance.options.unify) {
                    callback(instance);
                }
            });
        }
    },

    /*========================================================================*\
     * Layout
    \*========================================================================*/
    getLayout: function(type) {
        // <strict>
        if (typeof type === 'undefined') {
            handleInvalidArgumentError('Parameter 1 to getLayout is expected to be a layout type', type);
            return;
        }
        // </strict>
        return this.layouts[type];
    },

    loadLayouts: function() {
        for (var name in this.options.layouts) {
            if (typeof Raptor.layouts[name] === 'undefined') {
                // <strict>
                debug('Unknown layout type: ' + name);
                // </strict>
                continue;
            }
            this.layouts[name] = this.prepareComponent(Raptor.layouts[name], this.options.layouts[name], 'layout').instance;

            if (this.layouts[name].hotkeys) {
                this.registerHotkey(this.layouts[name].hotkeys, null, this.layouts[name]);
            }
        }
    },

    layoutsDestruct: function() {
        for (var name in this.layouts) {
            this.layouts[name].destruct();
        }
    },

    prepareComponent: function(component, componentOptions, prefix) {
        var instance = $.extend({}, component);

        var options = $.extend({}, instance.options, this.options, {
            baseClass: this.options.baseClass + '-' + prefix + '-' + stringFromCamelCase(component.name)
        }, componentOptions);

        instance.raptor = this;
        instance.options = options;
        // <strict>
        if (!instance.init) {
            handleError('Component missing init function: ' + instance.name);
        }
        // </strict>
        var init = instance.init();

        return {
            init: init,
            instance: instance
        };
    },

    /**
     * Show the layout for the current element.
     */
    showLayout: function() {
        // <debug>
        if (debugLevel >= MID) debug('Displaying layout', this.getElement());
        // </debug>

        // If unify option is set, hide all other layouts first
        this.unify(function(raptor) {
            raptor.fire('layoutHide');
        }, false);

        this.fire('layoutShow');

        this.fire('resize');
        if (typeof this.getElement().attr('tabindex') === 'undefined') {
            this.getElement().attr('tabindex', -1);
        }
    },

    /*========================================================================*\
     * Template functions
    \*========================================================================*/

    /**
     * @param {String} name
     * @param {Object} variables
     */
    getTemplate: function(name, variables) {
        if (!this.templates[name]) {
            this.templates[name] = templateGet(name, this.options.urlPrefix);
        }
        // <strict>
        if (!this.templates[name]) {
            handleError('Missing template: ' + name);
            return '**MISSING TEMPLATE: ' + name + '**';
        }
        // </strict>
        return templateConvertTokens(this.templates[name], variables);
    },

    /*========================================================================*\
     * History functions
    \*========================================================================*/

    /**
     *
     */
    historyPush: function() {
        if (!this.historyEnabled) return;
        var html = this.getHtml();
        if (html !== this.historyPeek()) {
            // Reset the future on change
            if (this.present !== this.history.length - 1) {
                this.history = this.history.splice(0, this.present + 1);
            }

            // Add new HTML to the history
            this.history.push(this.getHtml());

            // Mark the persent as the end of the history
            this.present = this.history.length - 1;

            this.fire('historyChange');
        }
    },

    /**
     * @returns {String|null}
     */
    historyPeek: function() {
        if (!this.history.length) return null;
        return this.history[this.present];
    },

    /**
     *
     */
    historyBack: function() {
        if (this.present > 0) {
            this.present--;
            this.setHtml(this.history[this.present]);
            this.historyEnabled = false;
            this.change();
            this.historyEnabled = true;
            this.fire('historyChange');
        }
    },

    /**
     *
     */
    historyForward: function() {
        if (this.present < this.history.length - 1) {
            this.present++;
            this.setHtml(this.history[this.present]);
            this.historyEnabled = false;
            this.change();
            this.historyEnabled = true;
            this.fire('historyChange');
        }
    },

    /*========================================================================*\
     * Hotkeys
    \*========================================================================*/

    /**
     * @param {Array|String} mixed The hotkey name or an array of hotkeys
     * @param {Object} The hotkey object or null
     */
    registerHotkey: function(mixed, action) {
        // <strict>
        if (!typeIsString(mixed)) {
            handleInvalidArgumentError('Expected argument 1 to raptor.registerHotkey to be a string');
            return;
        }
        if (this.hotkeys[mixed]) {
            handleError('Hotkey "' + mixed + '" has already been registered, and will be overwritten');
        }
        // </strict>

        this.hotkeys[mixed] = action;
    },

    bindHotkeys: function() {
        for (var keyCombination in this.hotkeys) {
            this.getElement().on('keydown.raptor', keyCombination, function(event) {
                if (this.isEditing() && !this.hotkeysSuspended) {
                    var result = this.hotkeys[event.data]();
                    if (result !== false) {
                        event.preventDefault();
                    }
                }
            }.bind(this));
        }
    },

    /**
     * Suspend hotkey functionality.
     */
    suspendHotkeys: function() {
        // <debug>
        if (debugLevel >= MID) debug('Disabling hotkeys');
        // </debug>
        this.hotkeysSuspended = true;
    },

    /**
     * Resume hotkey functionality.
     */
    resumeHotkeys: function() {
        // <debug>
        if (debugLevel >= MID) debug('Enabling hotkeys');
        // </debug>
        this.hotkeysSuspended = false;
    },

    /*========================================================================*\
     * Buttons
    \*========================================================================*/

    isUiEnabled: function(ui) {
        // Check if we are not automatically enabling UI, and if not, check if the UI was manually enabled
        if (this.options.enableUi === false &&
                typeof this.options.plugins[ui] === 'undefined' ||
                this.options.plugins[ui] === false) {
            // <debug>
            if (debugLevel >= MID) {
                debug('UI with name ' + ui + ' has been disabled ' + (
                    this.options.enableUi === false ? 'by default' : 'manually'
                ) + ' ' + $.inArray(ui, this.options.ui));
            }
            // </debug>
            return false;
        }

        // Check if we have explicitly disabled UI
        if ($.inArray(ui, this.options.disabledUi) !== -1 ||
                $.inArray(ui, this.options.disabledPlugins) !== -1) {
            // <strict>
            debug('Using disabledUi/disabledPlugins options is deprecated, use plugins: { nameOfPlugin: false } instead.');
            // </strict>
            return false;
        }

        return true;
    },

    /**
     * @deprecated
     * @param  {String} ui Name of the UI object to be returned.
     * @return {Object|null} UI object referenced by the given name.
     */
    getUi: function(ui) {
        // <strict>
        handleError('raptor.getUi() is deprecated, use raptor.getPlugin() instead.');
        // </strict>
        return this.uiObjects[ui];
    },

    /*========================================================================*\
     * Plugins
    \*========================================================================*/
    /**
     * @param {String} name
     * @return {Object|undefined} plugin
     */
    getPlugin: function(name) {
        return this.uiObjects[name] || this.plugins[name];
    },

    /**
     *
     */
    loadPlugins: function() {
        var editor = this;

        if (!this.options.plugins) {
            this.options.plugins = {};
        }

        for (var name in Raptor.plugins) {
            // Check if we are not automaticly enabling plugins, and if not, check if the plugin was manually enabled
            if (this.options.enablePlugins === false &&
                    typeof this.options.plugins[name] === 'undefined' ||
                    this.options.plugins[name] === false) {
                // <debug>
                if (debugLevel >= MID) {
                    debug('Not loading plugin ' + name);
                }
                // </debug>
                continue;
            }

            // Check if we have explicitly disabled the plugin
            if ($.inArray(name, this.options.disabledUi) !== -1 ||
                    $.inArray(name, this.options.disabledPlugins) !== -1) {
                // <strict>
                debug('Using disabledUi/disabledPlugins options is deprecated, use plugins: { nameOfPlugin: false } instead.');
                // </strict>
                continue;
            }

            editor.plugins[name] = this.prepareComponent(Raptor.plugins[name], editor.options.plugins[name], 'plugin').instance;
        }
    },

    /*========================================================================*\
     * Content accessors
    \*========================================================================*/

    /**
     * @returns {boolean}
     */
    isDirty: function() {
        return this.dirty;
    },

    /**
     * @returns {String}
     */
    getHtml: function() {
        return this.getElement().html();
    },

    clean: function() {
        this.actionApply(function() {
            clean(this.getElement());
        }.bind(this));
    },

    /**
     * @param {String} html
     */
    setHtml: function(html) {
        this.getElement().html(html);
        this.fire('html');
        this.checkChange();
    },

    /**
     *
     */
    resetHtml: function() {
        this.setHtml(this.getOriginalHtml());
        this.fire('cleaned');
    },

    /**
     * @returns {String}
     */
    getOriginalHtml: function() {
        return this.originalHtml;
    },

    /**
     *
     */
    saved: function(args) {
        this.setOriginalHtml(this.getHtml());
        this.dirty = false;
        this.fire('saved', args);
        this.fire('cleaned');
    },

    /**
     * @param {String} html
     */
    setOriginalHtml: function(html) {
        this.originalHtml = html;
    },

    /*========================================================================*\
     * Event handling
    \*========================================================================*/
    /**
     * @param {String} name
     * @param {function} callback
     * @param {Object} [context]
     */
    bind: function(name, callback, context) {
        // <strict>
        if (!$.isFunction(callback)) {
            handleError('Must bind a valid callback, ' + name + ' was a ' + typeof callback);
            return;
        }
        // </strict>
        var names = name.split(/,\s*/);
        for (var i = 0, l = names.length; i < l; i++) {
        	name = names[i].toLowerCase().replace(/[^a-z]/, '');
            // <debug>
            if (debugLevel > MIN) {
                debug('Binding event: ' + name);
            }
            // </debug>
            if (!this.events[name]) {
                this.events[name] = [];
            }
            this.events[name].push({
                context: context,
                callback: callback
            });
        }
    },

    /**
     * @param {String} name
     * @param {function} callback
     * @param {Object} [context]
     */
    unbind: function(name, callback, context) {
    	name = name.toLowerCase().replace(/[^a-z]/, '');
        // <debug>
        if (debugLevel > MIN) {
            debug('Unbinding event: ' + name);
        }
        // </debug>
        for (var i = 0, l = this.events[name].length; i < l; i++) {
            if (this.events[name][i] &&
                this.events[name][i].callback === callback &&
                this.events[name][i].context === context) {
                this.events[name].splice(i, 1);
            }
        }
    },

    /**
     * @param {String} name
     * @param {boolean} [global]
     * @param {boolean} [sub]
     */
    fire: function(name, args) {
    	name = name.toLowerCase().replace(/[^a-z]/, '');
        var result = [];

        // <debug>
        if (debugLevel === MAX) {
            debug('Firing event: ' + name);
        }
        // </debug>

        if (this.events[name]) {
            for (var i = 0, l = this.events[name].length; i < l; i++) {
                var event = this.events[name][i];
                if (typeof event !== 'undefined' &&
                        typeof event.callback !== 'undefined') {
                    var currentResult = event.callback.apply(event.context || this, args);
                    if (typeof currentResult !== 'undefined') {
                        result = result.concat(currentResult);
                    }
                }
            }
        }

        return result;
    }
};

$.widget('ui.raptor', RaptorWidget);
$.fn.raptor.Raptor = Raptor;;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/raptor-widget.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout.js
function RaptorLayout(name) {
    this.name = name;
}

RaptorLayout.prototype.init = function() {
};

RaptorLayout.prototype.destruct = function() {
};

RaptorLayout.prototype.isVisible = function() {
    return false;
};

RaptorLayout.prototype.show = function() {
};

RaptorLayout.prototype.hide = function() {
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/plugin.js
/**
 * @fileOverview Contains the raptor plugin class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The raptor plugin class.
 *
 * @todo type and desc for name.
 * @param {type} name
 * @param {Object} overrides Options hash.
 * @returns {RaptorPlugin}
 */
function RaptorPlugin(name, overrides) {
    this.name = name;
    for (var key in overrides) {
        this[key] = overrides[key];
    }
}

/**
 * Initialize the raptor plugin.
 */
RaptorPlugin.prototype.init = function() {};

/**
 * Enable the raptor plugin.
 */
RaptorPlugin.prototype.enable = function() {};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/plugin.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/ui-group.js
function UiGroup(raptor, uiOrder) {
    this.raptor = raptor;
    this.uiOrder = uiOrder;
};

UiGroup.prototype.appendTo = function(layout, panel) {
    // Loop the UI component order option
    for (var i = 0, l = this.uiOrder.length; i < l; i++) {
        var uiGroupContainer = $('<div/>')
            .addClass(this.raptor.options.baseClass + '-layout-toolbar-group');

        // Loop each UI in the group
        var uiGroup = this.uiOrder[i];
        for (var ii = 0, ll = uiGroup.length; ii < ll; ii++) {
            // Check if the UI component has been explicitly disabled
            if (!this.raptor.isUiEnabled(uiGroup[ii])) {
                continue;
            }

            // Check the UI has been registered
            if (Raptor.ui[uiGroup[ii]]) {
                var uiOptions = this.raptor.options.plugins[uiGroup[ii]];
                if (uiOptions === false) {
                    continue;
                }

                var component = this.raptor.prepareComponent(Raptor.ui[uiGroup[ii]], uiOptions, 'ui');
                component.instance.layout = layout;

                this.raptor.uiObjects[uiGroup[ii]] = component.instance;

                if (typeIsElement(component.init)) {
                    // Fix corner classes
                    component.init.removeClass('ui-corner-all');

                    // Append the UI object to the group
                    uiGroupContainer.append(component.init);
                }
            }
            // <strict>
            else {
                handleError('UI identified by key "' + uiGroup[ii] + '" does not exist');
            }
            // </strict>
        }

        // Append the UI group to the editor toolbar
        if (uiGroupContainer.children().length > 0) {
            uiGroupContainer.appendTo(panel);
        }
    }

    // Fix corner classes
    panel.find('.ui-button:first-child').addClass('ui-corner-left');
    panel.find('.ui-button:last-child').addClass('ui-corner-right');
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/ui-group.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/toolbar.js
/**
 * @fileOverview Toolbar layout.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

function ToolbarLayout() {
    RaptorLayout.call(this, 'toolbar');
    this.wrapper = null;
}

ToolbarLayout.prototype = Object.create(RaptorLayout.prototype);

ToolbarLayout.prototype.init = function() {
    this.raptor.bind('enabled', this.show.bind(this));
    this.raptor.bind('disabled', this.hide.bind(this));
    this.raptor.bind('layoutShow', this.show.bind(this));
    this.raptor.bind('layoutHide', this.hide.bind(this));
    $(window).resize(this.constrainPosition.bind(this));
};

ToolbarLayout.prototype.destruct = function() {
    if (this.wrapper) {
        this.wrapper.remove();
        this.wrapper = null;
    }
    this.raptor.fire('toolbarDestroy');
};

/**
 * Show the toolbar.
 *
 * @fires RaptorWidget#toolbarShow
 */
ToolbarLayout.prototype.show = function() {
    if (!this.isVisible()) {
        this.getElement().css('display', '');
        this.constrainPosition();
        if (this.raptor.getElement().zIndex() > this.getElement().zIndex()) {
            this.getElement().css('z-index', this.raptor.getElement().zIndex() + 1);
        } else {
            this.getElement().css('z-index', null);
        }
        this.raptor.fire('toolbarShow');
    }
};

/**
 * Hide the toolbar.
 *
 * @fires RaptorWidget#toolbarHide
 */
ToolbarLayout.prototype.hide = function() {
    if (this.isReady()) {
        this.getElement().css('display', 'none');
        this.raptor.fire('toolbarHide');
    }
};

ToolbarLayout.prototype.initDragging = function() {
    if ($.fn.draggable &&
            this.options.draggable &&
            !this.getElement().data('ui-draggable')) {
        // <debug>
        if (debugLevel >= MID) {
            debug('Initialising toolbar dragging', this.raptor.getElement());
        }
        // </debug>
        this.getElement().draggable({
            cancel: 'a, button',
            cursor: 'move',
            stop: this.constrainPosition.bind(this)
        });
        // Remove the relative position
        this.getElement().css('position', 'fixed');

        // Set the persistent position
        var pos = this.raptor.persist('position') || this.options.dialogPosition;

        if (!pos) {
            pos = [10, 10];
        }

        // <debug>
        if (debugLevel >= MID) {
            debug('Restoring toolbar position', this.raptor.getElement(), pos);
        }
        // </debug>

        if (parseInt(pos[0], 10) + this.getElement().outerHeight() > $(window).height()) {
            pos[0] = $(window).height() - this.getElement().outerHeight();
        }
        if (parseInt(pos[1], 10) + this.getElement().outerWidth() > $(window).width()) {
            pos[1] = $(window).width() - this.getElement().outerWidth();
        }

        this.getElement().css({
            top: Math.abs(parseInt(pos[0], 10)),
            left: Math.abs(parseInt(pos[1], 10))
        });
    }
};

ToolbarLayout.prototype.enableDragging = function() {
    if ($.fn.draggable &&
            this.options.draggable &&
            this.getElement().data('ui-draggable')) {
        this.getElement().draggable('enable');
    }
};

ToolbarLayout.prototype.disableDragging = function() {
    if ($.fn.draggable &&
            this.options.draggable &&
            this.getElement().is('.ui-draggable')) {
        this.getElement().draggable('disable').removeClass('ui-state-disabled');
    }
};

ToolbarLayout.prototype.isReady = function() {
    return this.wrapper !== null;
};

ToolbarLayout.prototype.isVisible = function() {
    return this.isReady() && this.getElement().is(':visible');
};

ToolbarLayout.prototype.constrainPosition = function() {
    if (this.isVisible()) {
        var x = parseInt(this.wrapper.css('left')) || -999,
            y = parseInt(this.wrapper.css('top')) || -999,
            width = this.wrapper.outerWidth(),
            height = this.wrapper.outerHeight(),
            windowWidth = $(window).width(),
            windowHeight = $(window).height(),
            newX = Math.max(0, Math.min(x, windowWidth - width)),
            newY = Math.max(0, Math.min(y, windowHeight - height));

        if (newX !== x || newY !== y) {
            this.wrapper.css({
                left: newX,
                top: newY
            });
        }

        // Save the persistent position
        this.raptor.persist('position', [
            this.wrapper.css('top'),
            this.wrapper.css('left')
        ]);
    }
};

ToolbarLayout.prototype.getElement = function() {
    if (this.wrapper === null) {
        // Load all UI components if not supplied
        if (!this.options.uiOrder) {
            this.options.uiOrder = [[]];
            for (var name in Raptor.ui) {
                this.options.uiOrder[0].push(name);
            }
        }

        // <debug>
        if (debugLevel >= MID) {
            debug('Loading toolbar', this.raptor.getElement());
        }
        // </debug>

        var toolbar = this.toolbar = $('<div/>')
            .addClass(this.options.baseClass + '-toolbar');
        var innerWrapper = this.toolbarWrapper = $('<div/>')
            .addClass(this.options.baseClass + '-inner')
            .addClass('ui-widget-content')
            .mousedown(function(event) {
                event.preventDefault();
            })
            .append(toolbar);
        var path = this.path = $('<div/>')
            .addClass(this.options.baseClass + '-path')
            .addClass('ui-widget-header');
        var wrapper = this.wrapper = $('<div/>')
            .addClass('raptor-ui')
            .addClass(this.options.baseClass + '-outer ' + this.raptor.options.baseClass + '-layout')
            .css('display', 'none')
            .append(path)
            .append(innerWrapper);

        var uiGroup = new UiGroup(this.raptor, this.options.uiOrder);
        uiGroup.appendTo(this, this.toolbar);
        $('<div/>').css('clear', 'both').appendTo(this.toolbar);

        $(function() {
            wrapper.appendTo('body');
            this.initDragging();
            this.constrainPosition(true);
            this.raptor.fire('layoutReady', [this.wrapper]);
            this.raptor.fire('toolbarReady', [this]);
        }.bind(this));
    }
    return this.wrapper;
};

Raptor.registerLayout(new ToolbarLayout());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/toolbar.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/hover-panel.js
/**
 * @fileOverview Hover panel layout.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */

function HoverPanelLayout() {
    RaptorLayout.call(this, 'hoverPanel');
    this.hoverPanel = null;
    this.visible = false;
}

HoverPanelLayout.prototype = Object.create(RaptorLayout.prototype);

HoverPanelLayout.prototype.init = function() {
    this.raptor.bind('ready', this.ready.bind(this));
    this.raptor.bind('enabled', this.enabled.bind(this));
};

HoverPanelLayout.prototype.ready = function() {
    this.raptor.getElement()
        .mouseenter(this.show.bind(this))
        .mouseleave(this.hide.bind(this));
};

HoverPanelLayout.prototype.enabled = function() {
    this.getElement().hide();
};

HoverPanelLayout.prototype.getElement = function() {
    if (this.hoverPanel === null) {
        this.hoverPanel = $('<div/>')
            .addClass(this.raptor.options.baseClass + '-layout ' + this.options.baseClass)
            .mouseleave(this.hide.bind(this));

        var uiGroup = new UiGroup(this.raptor, this.options.uiOrder);
        uiGroup.appendTo(this, this.hoverPanel);

        $(window).bind('scroll', this.position.bind(this));

        this.hoverPanel
            .appendTo('body');

        this.raptor.fire('layoutReady', [this.hoverPanel]);
    }
    return this.hoverPanel;
};

HoverPanelLayout.prototype.show = function(event) {
    if (!this.raptor.isEditing()) {
        this.visible = true;
        this.getElement().show();
        if (this.raptor.getElement().zIndex() > this.getElement().zIndex()) {
            this.getElement().css('z-index', this.raptor.getElement().zIndex() + 1);
        } else {
            this.getElement().css('z-index', null);
        }
        this.position();
        this.raptor.getElement().addClass(this.raptor.options.baseClass + '-editable-block-hover');
    }
};

HoverPanelLayout.prototype.hide = function(event) {
    if (!this.visible) {
        return;
    }
    if (!event) {
        return;
    }
    if ($.contains(this.getElement().get(0), event.relatedTarget)) {
        return;
    }
    if (event.relatedTarget === this.getElement().get(0)) {
        return;
    }
    if (this.getElement().get(0) === $(event.relatedTarget).parent().get(0)) {
        return;
    }
    if ($.contains(this.raptor.getElement().get(0), event.relatedTarget)) {
        return;
    }
    if (event.relatedTarget === this.raptor.getElement().get(0)) {
        return;
    }
    this.visible = false;
    this.getElement().hide();
    this.raptor.getElement().removeClass(this.raptor.options.baseClass + '-editable-block-hover');
};

HoverPanelLayout.prototype.position = function() {
    if (this.visible) {
        var visibleRect = elementVisibleRect(this.raptor.getElement());
        this.getElement().css({
            // Calculate offset center for the hoverPanel
            top:  visibleRect.top  + ((visibleRect.height / 2) - (this.getElement().outerHeight() / 2)),
            left: visibleRect.left + ((visibleRect.width / 2)  - (this.getElement().outerWidth()  / 2))
        });
    }
};

HoverPanelLayout.prototype.destruct = function() {
    if (this.hoverPanel) {
        this.hoverPanel.remove();
        this.hoverPanel = null;
    }
    this.visible = false;
};

Raptor.registerLayout(new HoverPanelLayout());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/hover-panel.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/element-hover-panel.js
/**
 * @fileOverview Element hover panel layout.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 */

function ElementHoverPanelLayout() {
    RaptorLayout.call(this, 'elementHoverPanel');
    this.elements = 'img';
    this.hoverPanel = null;
    this.visible = false;
    this.target = null;
    this.enabled = true;
}

ElementHoverPanelLayout.prototype = Object.create(RaptorLayout.prototype);

ElementHoverPanelLayout.prototype.init = function() {
    this.raptor.bind('ready', this.ready.bind(this));
};

ElementHoverPanelLayout.prototype.ready = function() {
    this.raptor.getElement()
        .on('mouseenter', this.options.elements, this.show.bind(this))
        .on('mouseleave', this.options.elements, this.hide.bind(this));
};

ElementHoverPanelLayout.prototype.getElement = function() {
    if (this.hoverPanel === null) {
        this.hoverPanel = $('<div/>')
            .addClass(this.raptor.options.baseClass + '-layout raptor-layout-hover-panel ' + this.options.baseClass)
            .mouseleave(this.hide.bind(this));

        var uiGroup = new UiGroup(this.raptor, this.options.uiOrder);
        uiGroup.appendTo(this, this.hoverPanel);

        $(window).bind('scroll', this.position.bind(this));

        this.hoverPanel
            .appendTo('body');

        this.raptor.fire('layoutReady', [this.hoverPanel]);
    }
    return this.hoverPanel;
};

ElementHoverPanelLayout.prototype.show = function(event) {
    if (this.enabled && this.raptor.isEditing()) {
        this.target = event.target;
        this.visible = true;
        elementPositionOver(this.getElement().show(), $(this.target));
    }
};

ElementHoverPanelLayout.prototype.hide = function(event) {
    if (!this.visible) {
        return;
    }
    if (event) {
        if ($.contains(this.getElement().get(0), event.relatedTarget)) {
            return;
        }
        if (event.relatedTarget === this.getElement().get(0)) {
            return;
        }
        if (this.getElement().get(0) === $(event.relatedTarget).parent().get(0)) {
            return;
        }
        if ($.contains(this.raptor.getElement().get(0), event.relatedTarget)) {
            return;
        }
        if (event.relatedTarget === this.raptor.getElement().get(0)) {
            return;
        }
    }
    this.visible = false;
    this.getElement().hide();
};

ElementHoverPanelLayout.prototype.close = function() {
    if (this.visible) {
        this.enabled = false;
        this.visible = false;
        this.getElement().hide();
        setTimeout(function() {
            this.enabled = true;
        }.bind(this), 1000);
    }
};

ElementHoverPanelLayout.prototype.position = function() {
    if (this.visible) {
        elementPositionOver(this.getElement(), $(this.target));
    }
};

ElementHoverPanelLayout.prototype.destruct = function() {
    if (this.hoverPanel) {
        this.hoverPanel.remove();
        this.hoverPanel = null;
    }
    this.visible = false;
};

Raptor.registerLayout(new ElementHoverPanelLayout());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/layout/element-hover-panel.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/button.js
/**
 * @fileOverview Contains the core button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The core button class.
 *
 * @param {Object} overrides Options hash.
 */
function Button(overrides) {
    this.text = false;
    this.label = null;
    this.icon = null;
    this.hotkey = null;
    for (var key in overrides) {
        this[key] = overrides[key];
    }
}

/**
 * Initialize the button.
 *
 * @return {Element}
 */
Button.prototype.init = function() {
    // Bind hotkeys
    if (typeof this.hotkey === 'string') {
        this.raptor.registerHotkey(this.hotkey, this.action.bind(this));
    } else if (typeIsArray(this.hotkey)) {
        for (var i = 0, l = this.hotkey.length; i < l; i++) {
            this.raptor.registerHotkey(this.hotkey[i], this.action.bind(this));
        }
    }

    // Return the button
    return this.getButton();
};

/**
 * Prepare and return the button Element to be used in the Raptor UI.
 *
 * @return {Element}
 */
Button.prototype.getButton = function() {
    if (!this.button) {
        var text = this.text || this.translate('Text', false);
        this.button = $('<div>')
            .html(text)
            .addClass(this.options.baseClass)
            .attr('title', this.getTitle())
            .click(this.click.bind(this));
        aButton(this.button, {
            icons: {
                primary: this.getIcon()
            },
            text: text,
            label: this.label
        });
    }
    return this.button;
};

/**
 * @return {String} The button's title property value, or if not present then the
 *   localized value for the button's name + Title.
 */
Button.prototype.getTitle = function() {
    return this.title || this.translate('Title');
};

/**
 * @return {String} The button's icon property value, or the ui-icon- prefix
 *   with the button's camel cased name appended.
 */
Button.prototype.getIcon = function() {
    if (this.icon === null) {
        return 'ui-icon-' + stringFromCamelCase(this.name);
    }
    return this.icon;
};

/**
 * Perform the button's action.
 *
 * @todo this probably should not nest actions
 */
Button.prototype.click = function() {
    if (aButtonIsEnabled(this.button)) {
        this.raptor.actionApply(this.action.bind(this));
    }
};

Button.prototype.translate = function(translation, variables) {
    return tr(this.name + translation, variables);
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/preview-button.js
/**
 * @fileOverview Contains the preview button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The preview button class.
 *
 * @constructor
 * @augments Button
 *
 * @param {Object} options
 */
function PreviewButton(options) {
    this.previewing = false;
    this.previewTimer = null;
    this.options = {
        preview: true,
        previewTimeout: 500
    };
    Button.call(this, options);
}

PreviewButton.prototype = Object.create(Button.prototype);

/**
 * Prepare and return the preview button Element to be used in the Raptor UI.
 *
 * @returns {Element}
 */
PreviewButton.prototype.getButton = function() {
    if (!this.button) {
        this.button = Button.prototype.getButton.call(this)
            .mouseenter(this.mouseEnter.bind(this))
            .mouseleave(this.mouseLeave.bind(this));
    }
    return this.button;
};

PreviewButton.prototype.applyPreview = function() {
    if (this.canPreview()) {
        this.previewing = true;
        this.raptor.actionPreview(this.action.bind(this));
    }
};

PreviewButton.prototype.endPreview = function() {
    if (this.previewTimer !== null) {
        clearTimeout(this.previewTimer);
        this.previewTimer = null;
    }
    this.previewing = false;
};

/**
 * Mouse enter event that enables the preview.
 */
PreviewButton.prototype.mouseEnter = function() {
    if (this.canPreview()) {
        this.endPreview();
        if (this.options.previewTimeout !== false) {
            this.previewTimer = setTimeout(this.applyPreview.bind(this), this.options.previewTimeout)
        } else {
            this.applyPreview();
        }
    }
};

/**
 * Mouse leave event that reverts preview (if active).
 */
PreviewButton.prototype.mouseLeave = function() {
    this.endPreview();
    this.raptor.actionPreviewRestore();
};

/**
 * Click event that reverts preview (if active), and the fires the inherited button click event.
 */
PreviewButton.prototype.click = function() {
    this.endPreview();
    return Button.prototype.click.apply(this, arguments);
};

/**
 * Checks if previewing is enabled.
 *
 * @returns {Boolean}
 */
PreviewButton.prototype.canPreview = function() {
    return this.options.preview;
};

/**
 * Checks if previewing is currently active.
 *
 * @returns {Boolean}
 */
PreviewButton.prototype.isPreviewing = function() {
    return this.previewing;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/preview-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/toggle-button.js
/**
 * @fileOverview Contains the core button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The toggle button class.
 *
 * @constructor
 * @augments Button
 *
 * @param {Object} options
 */
function ToggleButton(options) {
    this.disable = false;
    Button.call(this, options);
}

ToggleButton.prototype = Object.create(Button.prototype);

/**
 * Initialize the toggle button.
 *
 * @returns {Element}
 */
ToggleButton.prototype.init = function() {
    this.raptor.bind('selectionChange', this.selectionChange.bind(this));
    return Button.prototype.init.apply(this, arguments);
};

/**
 * Changes the state of the button depending on whether it is active or not.
 */
ToggleButton.prototype.selectionChange = function() {
    if (this.selectionToggle()) {
        aButtonActive(this.button);
        if (this.disable) {
            aButtonEnable(this.button);
        }
    } else {
        aButtonInactive(this.button);
        if (this.disable) {
            aButtonDisable(this.button);
        }
    }
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/toggle-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/preview-toggle-button.js
/**
 * @fileOverview Contains the preview toggle button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class the preview toggle button class.
 *
 * @constructor
 * @augments PreviewButton
 *
 * @param {Object} options
 */
function PreviewToggleButton(options) {
    PreviewButton.call(this, options);
}

PreviewToggleButton.prototype = Object.create(PreviewButton.prototype);

/**
 * Initialize the toggle preview button.
 *
 * @returns {Element}
 */
PreviewToggleButton.prototype.init = function() {
    this.raptor.bind('selectionChange', this.selectionChange.bind(this));
    return PreviewButton.prototype.init.apply(this, arguments);
};

/**
 * Sets the state of the button to active when preview is enabled.
 */
PreviewToggleButton.prototype.selectionChange = function() {
    if (this.selectionToggle()) {
        if (!this.isPreviewing()) {
            aButtonActive(this.button);
        }
    } else {
        aButtonInactive(this.button);
    }
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/preview-toggle-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/filtered-preview-button.js
/**
 * @fileOverview Contains the filtered preview button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class the filtered preview button class.
 *
 * @constructor
 * @augments PreviewButton
 *
 * @param {Object} options
 */
function FilteredPreviewButton(options) {
    Button.call(this, options);
}

FilteredPreviewButton.prototype = Object.create(PreviewButton.prototype);

/**
 * Initialize the filtered preview button.
 *
 * @returns {Element} result
 */
FilteredPreviewButton.prototype.init = function() {
    var result = PreviewButton.prototype.init.apply(this, arguments);
    this.raptor.bind('selectionChange', this.selectionChange.bind(this));
    return result;
};

/**
 * Toggles the button's disabled state.
 */
FilteredPreviewButton.prototype.selectionChange = function() {
    if (this.isEnabled()) {
        aButtonEnable(this.button);
    } else {
        aButtonDisable(this.button);
    }
};

// <strict>
/**
 * Get the element according to the button's filtereing strategy.
 * @throws {Error} If this function is not overridden.
 * @param  {RangyRange} range
 * @return {Element} The filtered element.
 */
FilteredPreviewButton.prototype.getElement = function(range) {
    throw new Error('Expected child class to override FilteredPreviewButton.getElement');
};
// </strict>


/**
 * @returns {Boolean} True if preview available and if the button is enabled, false otherwise.
 */
FilteredPreviewButton.prototype.canPreview = function() {
    return PreviewButton.prototype.canPreview.call(this) && this.isEnabled();
};

/**
 * @returns {Boolean} True if button is enabled, false otherwise.
 */
FilteredPreviewButton.prototype.isEnabled = function() {
    var range = rangeGet();
    if (range) {
        return !!this.getElement(range);
    }
    return !!this.previewing;
};

/**
 * Perform the button's action.
 */
FilteredPreviewButton.prototype.action = function() {
    selectionEachRange(function(range) {
        var element = this.getElement(range);
        if (element) {
            this.applyToElement(element);
        }
    }.bind(this));
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/filtered-preview-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/css-class-applier-button.js
/**
 * @fileOverview Contains the CSS class applier button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The CSS class applier button.
 *
 * @constructor
 * @augments PreviewToggleButton
 * @param {Object} options
 */
function CSSClassApplierButton(options) {
    PreviewToggleButton.call(this, options);
}

CSSClassApplierButton.prototype = Object.create(PreviewToggleButton.prototype);

/**
 * Applies the class from the button to a selection.
 */
CSSClassApplierButton.prototype.action = function() {
    selectionExpandToWord();
    this.raptor.selectionConstrain();
    for (var i = 0, l = this.classes.length; i < l; i++) {
        var applier = rangy.createCssClassApplier(this.options.cssPrefix + this.classes[i], {
            elementTagName: this.tag || 'span'
        });
        applier.toggleSelection();
    }
};

/**
 * Checks whether a class has been applied to a selection.
 *
 * @returns {Boolean} True if the css has been applied to the selection, false otherwise.
 */
CSSClassApplierButton.prototype.selectionToggle = function() {
    for (var i = 0, l = this.classes.length; i < l; i++) {
        var applier = rangy.createCssClassApplier(this.options.cssPrefix + this.classes[i], {
            elementTagName: this.tag || 'span'
        });
        if (!applier.isAppliedToSelection()) {
            return false;
        }
    }
    return true;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/css-class-applier-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/dialog-button.js
/**
 * @fileOverview Contains the dialog button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @type {Object} Container for Raptor dialogs.
 */
var dialogs = {};

/**
 * @class
 *
 * @constructor
 * @augments Button
 * @param {Object} options
 * @returns {DialogButton}
 */
function DialogButton(options) {
    this.state = null;
    Button.call(this, options);
}

DialogButton.prototype = Object.create(Button.prototype);

/**
 * A dialog button's action is to open a dialog, no content is modified at this
 * stage.
 */
DialogButton.prototype.action = function() {
    this.openDialog();
};

// <strict>
/**
 * Callback triggered when the user clicks the OK button on the dialog.
 *
 * @param {Object} dialog Dialog to get the ok button from.
 * @throws {Error} If this function is not overridden.
 */
DialogButton.prototype.applyAction = function(dialog) {
    throw new Error('Expected child class to override DialogButton.applyAction');
};

/**
 * Callback triggered when the user clicks on the dialog button.
 *
 * @throws {Error} If this function is not overridden.
 */
DialogButton.prototype.getDialogTemplate = function() {
    throw new Error('Expected child class to override DialogButton.getDialogTemplate');
};
// </strict>

/**
 * Checks the validility of a dialog.
 *
 * @param {type} dialog
 * @returns {Boolean} True if dialog is valid, false otherwise.
 */
DialogButton.prototype.validateDialog = function(dialog) {
    return true;
};

/**
 * Opens a dialog.
 *
 * @param {Object} dialog The dialog to open.
 */
DialogButton.prototype.openDialog = function() {
    this.raptor.pause();
    aDialogOpen(this.getDialog());
};

DialogButton.prototype.onDialogClose = function() {
    dialogs[this.name].instance.raptor.resume();
};

DialogButton.prototype.okButtonClick = function(event) {
    var valid = dialogs[this.name].instance.validateDialog();
    if (valid === true) {
        aDialogClose(dialogs[this.name].dialog);
        dialogs[this.name].instance.applyAction.call(dialogs[this.name].instance, dialogs[this.name].dialog);
    }
};

DialogButton.prototype.closeDialog = function() {
    aDialogClose(dialogs[this.name].dialog);
};

DialogButton.prototype.cancelButtonClick = DialogButton.prototype.closeDialog;

/**
 * Prepare and return the dialog's OK button's initialisation object.
 *
 * @param {String} name
 * @returns {Object} The initiialisation object for this dialog's OK button.
 */
DialogButton.prototype.getOkButton = function(name) {
    return {
        text: tr(name + 'DialogOKButton'),
        click: this.okButtonClick.bind(this),
        icons: {
            primary: 'ui-icon-circle-check'
        }
    };
};

/**
 * Prepare and return the dialog's cancel button's initialisation object.
 *
 * @param {String} name
 * @returns {Object} The initiialisation object for this dialog's cancel button.
 */
DialogButton.prototype.getCancelButton = function(name) {
    return {
        text: tr(name + 'DialogCancelButton'),
        click: this.cancelButtonClick.bind(this),
        icons: {
            primary: 'ui-icon-circle-close'
        }
    };
};

/**
 * Prepare and return the dialogs default options to be used in the Raptor UI.
 *
 * @param {String} name The name of the dialog to have the default options applied to it.
 * @returns {Object} the default options for the dialog.
 */
DialogButton.prototype.getDefaultDialogOptions = function(name) {
    var options = {
        modal: true,
        resizable: true,
        autoOpen: false,
        title: tr(name + 'DialogTitle'),
        dialogClass: this.options.baseClass + '-dialog ' + this.options.dialogClass,
        close: this.onDialogClose.bind(this),
        buttons: []
    };
    var okButton = this.getOkButton(name),
        cancelButton = this.getCancelButton(name);
    if (typeof okButton !== 'undefined' && okButton !== false) {
        options.buttons.push(okButton);
    }
    if (typeof cancelButton !== 'undefined' && cancelButton !== false) {
        options.buttons.push(cancelButton);
    }
    return options;
};

/**
 * Prepare and return the dialog to be used in the Raptor UI.
 *
 * @returns {Element} The dialog.
 */
DialogButton.prototype.getDialog = function() {
    if (typeof dialogs[this.name] === 'undefined') {
        dialogs[this.name] = {
            dialog: $(this.getDialogTemplate())
        };
        aDialog(dialogs[this.name].dialog, $.extend(this.getDefaultDialogOptions(this.name), this.dialogOptions));
    }
    dialogs[this.name].instance = this;
    return dialogs[this.name].dialog;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/dialog-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/dialog-toggle-button.js
/**
 * @fileOverview Contains the dialog toggle button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class
 *
 * @constructor
 * @augments DialogButton
 * @augments ToggleButton
 *
 * @param {type} options
 */
function DialogToggleButton(options) {
    DialogButton.call(this, options);
    ToggleButton.call(this, options);
}

DialogToggleButton.prototype = Object.create(DialogButton.prototype);

DialogToggleButton.prototype.init = ToggleButton.prototype.init;

DialogToggleButton.prototype.selectionChange = ToggleButton.prototype.selectionChange;
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/dialog-toggle-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/menu-button.js
/**
 * @fileOverview Contains the menu button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @constructor
 * @augments Button
 *
 * @param {Menu} menu The menu to create the menu button for.
 * @param {Object} options
 */
function MenuButton(menu, options) {
    this.menu = menu;
    this.name = menu.name;
    this.raptor = menu.raptor;
    this.options = menu.options;
    Button.call(this, options);
}

MenuButton.prototype = Object.create(Button.prototype);

/**
 * Shows the menu when button is clicked.
 *
 * @param {Event} event The click event.
 */
MenuButton.prototype.click = function(event) {
    if (this.menu.getMenu().is(':visible')) {
        $('.raptor-menu').hide();
    } else {
        this.menu.show();
    }
    event.preventDefault();
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/menu-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/menu.js
/**
 * @fileOverview Contains the menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class
 * @constructor
 *
 * @param {Object} options
 * @returns {Menu}
 */
function Menu(options) {
    this.menu = null;
    this.menuContent = '';
    this.button = null;
    for (var key in options) {
        this[key] = options[key];
    }
}

/**
 * Initialize the menu.
 *
 * @returns {MenuButton}
 */
Menu.prototype.init = function() {
    this.setOptions();
    var button = this.getButton().init();
    button.addClass('raptor-menu-button');
    return button;
};

/**
 * Prepare and return the menu's button Element to be used in the Raptor UI.
 *
 * @returns {MenuButton}
 */
Menu.prototype.getButton = function() {
    if (!this.button) {
        this.button = new MenuButton(this);
    }
    return this.button;
};

/**
 * Applies options to the menu.
 */
Menu.prototype.setOptions = function() {
    this.options.title = tr(this.name + 'Title');
    this.options.icon = 'ui-icon-' + this.name;
};

/**
 * Prepare and return the menu Element to be used in the Raptor UI.
 *
 * @returns {Element}
 */
Menu.prototype.getMenu = function() {
    if (!this.menu) {
        this.menu = $('<div>')
            .addClass('raptor-ui ui-menu ui-widget ui-widget-content ui-corner-all ' + this.options.baseClass + '-menu ' + this.raptor.options.baseClass + '-menu')
            .html(this.menuContent)
            .css('position', 'fixed')
            .hide()
            .mousedown(function(event) {
                // Prevent losing the selection on the editor target
                event.preventDefault();
            })
            .children()
            .appendTo('body');
    }
    return this.menu;
};

/**
 * Display menu.
 */
Menu.prototype.show = function() {
    $('.raptor-menu').hide();
    elementPositionUnder(this.getMenu().toggle(), this.getButton().getButton());
};

/**
 * Click off close event.
 *
 * @param {Event} event The click event.
 */
$('html').click(function(event) {
    if (!$(event.target).hasClass('raptor-menu-button') &&
            $(event.target).closest('.raptor-menu-button').length === 0) {
        $('.raptor-menu').hide();
    }
});
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/custom-menu.js
/**
 * @fileOverview Contains the custom menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The custom menu class.
 *
 * @constructor
 * @augments Menu
 *
 * Prepares and returns the custom menu Element to be used in the Raptor UI.
 *
 * @returns {Element}
 */
Menu.prototype.getMenu = function() {
    if (!this.menu) {
        this.menu = $('<div>')
            .addClass('raptor-ui ui-menu ui-widget ui-widget-content ui-corner-all ' + this.options.baseClass + '-menu ' + this.raptor.options.baseClass + '-menu')
            .html(this.menuContent)
            .css('position', 'fixed')
            .hide()
            .appendTo('body')
            .mousedown(function(event) {
                // Prevent losing the selection on the editor target
                event.preventDefault();
            });
    }
    return this.menu;
};

;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/custom-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/select-menu.js
/**
 * @fileOverview Contains the select menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The select menu class.
 *
 * @constructor
 * @augments Menu
 *
 * @param {Object} options
 */
function SelectMenu(options) {
    Menu.call(this, options);
}

SelectMenu.prototype = Object.create(Menu.prototype);

SelectMenu.prototype.menuItemMouseDown = function(event) {
    // Prevent losing the selection on the editor target
    event.preventDefault();
};

SelectMenu.prototype.menuItemClick = function(event) {
    aButtonSetLabel(this.button.button, $(event.target).html());
    $(this.menu).closest('ul').hide();
    // Prevent jQuery UI focusing the menu
    return false;
};

SelectMenu.prototype.menuItemMouseEnter = function(event) {
};

SelectMenu.prototype.menuItemMouseLeave = function(event) {
};

/**
 * Prepare and return the select menu Element to be used in the Raptor UI.
 *
 * @returns {Element} The select menu.
 */
SelectMenu.prototype.getMenu = function() {
    if (!this.menu) {
        this.menu = $('<ul>')
            .addClass('raptor-ui ' + this.options.baseClass + '-menu ' + this.raptor.options.baseClass + '-menu')
            .html(this.getMenuItems())
            .css('position', 'fixed')
            .hide()
            .find('a')
            .mousedown(this.menuItemMouseDown.bind(this))
            .mouseenter(this.menuItemMouseEnter.bind(this))
            .mouseleave(this.menuItemMouseLeave.bind(this))
            .click(this.menuItemClick.bind(this))
            .end()
            .appendTo('body');
        aMenu(this.menu);
    }
    return this.menu;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/components/ui/select-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/expose.js
// <expose>
if (typeof Raptor.Button === 'undefined' && typeof Button !== 'undefined') Raptor.Button = Button;
if (typeof Raptor.CSSClassApplierButton === 'undefined' && typeof CSSClassApplierButton !== 'undefined') Raptor.CSSClassApplierButton = CSSClassApplierButton;
if (typeof Raptor.DialogButton === 'undefined' && typeof DialogButton !== 'undefined') Raptor.DialogButton = DialogButton;
if (typeof Raptor.DialogToggleButton === 'undefined' && typeof DialogToggleButton !== 'undefined') Raptor.DialogToggleButton = DialogToggleButton;
if (typeof Raptor.ElementHoverPanelLayout === 'undefined' && typeof ElementHoverPanelLayout !== 'undefined') Raptor.ElementHoverPanelLayout = ElementHoverPanelLayout;
if (typeof Raptor.FilteredPreviewButton === 'undefined' && typeof FilteredPreviewButton !== 'undefined') Raptor.FilteredPreviewButton = FilteredPreviewButton;
if (typeof Raptor.HoverPanelLayout === 'undefined' && typeof HoverPanelLayout !== 'undefined') Raptor.HoverPanelLayout = HoverPanelLayout;
if (typeof Raptor.Menu === 'undefined' && typeof Menu !== 'undefined') Raptor.Menu = Menu;
if (typeof Raptor.MenuButton === 'undefined' && typeof MenuButton !== 'undefined') Raptor.MenuButton = MenuButton;
if (typeof Raptor.Plugin === 'undefined' && typeof Plugin !== 'undefined') Raptor.Plugin = Plugin;
if (typeof Raptor.PreviewButton === 'undefined' && typeof PreviewButton !== 'undefined') Raptor.PreviewButton = PreviewButton;
if (typeof Raptor.PreviewToggleButton === 'undefined' && typeof PreviewToggleButton !== 'undefined') Raptor.PreviewToggleButton = PreviewToggleButton;
if (typeof Raptor.RaptorLayout === 'undefined' && typeof RaptorLayout !== 'undefined') Raptor.RaptorLayout = RaptorLayout;
if (typeof Raptor.RaptorPlugin === 'undefined' && typeof RaptorPlugin !== 'undefined') Raptor.RaptorPlugin = RaptorPlugin;
if (typeof Raptor.SelectMenu === 'undefined' && typeof SelectMenu !== 'undefined') Raptor.SelectMenu = SelectMenu;
if (typeof Raptor.ToggleButton === 'undefined' && typeof ToggleButton !== 'undefined') Raptor.ToggleButton = ToggleButton;
if (typeof Raptor.ToolbarLayout === 'undefined' && typeof ToolbarLayout !== 'undefined') Raptor.ToolbarLayout = ToolbarLayout;
if (typeof Raptor.UiGroup === 'undefined' && typeof UiGroup !== 'undefined') Raptor.UiGroup = UiGroup;
if (typeof Raptor.aButton === 'undefined' && typeof aButton !== 'undefined') Raptor.aButton = aButton;
if (typeof Raptor.aButtonActive === 'undefined' && typeof aButtonActive !== 'undefined') Raptor.aButtonActive = aButtonActive;
if (typeof Raptor.aButtonDisable === 'undefined' && typeof aButtonDisable !== 'undefined') Raptor.aButtonDisable = aButtonDisable;
if (typeof Raptor.aButtonEnable === 'undefined' && typeof aButtonEnable !== 'undefined') Raptor.aButtonEnable = aButtonEnable;
if (typeof Raptor.aButtonInactive === 'undefined' && typeof aButtonInactive !== 'undefined') Raptor.aButtonInactive = aButtonInactive;
if (typeof Raptor.aButtonIsEnabled === 'undefined' && typeof aButtonIsEnabled !== 'undefined') Raptor.aButtonIsEnabled = aButtonIsEnabled;
if (typeof Raptor.aButtonSetIcon === 'undefined' && typeof aButtonSetIcon !== 'undefined') Raptor.aButtonSetIcon = aButtonSetIcon;
if (typeof Raptor.aButtonSetLabel === 'undefined' && typeof aButtonSetLabel !== 'undefined') Raptor.aButtonSetLabel = aButtonSetLabel;
if (typeof Raptor.aDialog === 'undefined' && typeof aDialog !== 'undefined') Raptor.aDialog = aDialog;
if (typeof Raptor.aDialogClose === 'undefined' && typeof aDialogClose !== 'undefined') Raptor.aDialogClose = aDialogClose;
if (typeof Raptor.aDialogOpen === 'undefined' && typeof aDialogOpen !== 'undefined') Raptor.aDialogOpen = aDialogOpen;
if (typeof Raptor.aDialogRemove === 'undefined' && typeof aDialogRemove !== 'undefined') Raptor.aDialogRemove = aDialogRemove;
if (typeof Raptor.aMenu === 'undefined' && typeof aMenu !== 'undefined') Raptor.aMenu = aMenu;
if (typeof Raptor.aNotify === 'undefined' && typeof aNotify !== 'undefined') Raptor.aNotify = aNotify;
if (typeof Raptor.aTabs === 'undefined' && typeof aTabs !== 'undefined') Raptor.aTabs = aTabs;
if (typeof Raptor.abortLoop === 'undefined' && typeof abortLoop !== 'undefined') Raptor.abortLoop = abortLoop;
if (typeof Raptor.actionApply === 'undefined' && typeof actionApply !== 'undefined') Raptor.actionApply = actionApply;
if (typeof Raptor.actionPreview === 'undefined' && typeof actionPreview !== 'undefined') Raptor.actionPreview = actionPreview;
if (typeof Raptor.actionPreviewRestore === 'undefined' && typeof actionPreviewRestore !== 'undefined') Raptor.actionPreviewRestore = actionPreviewRestore;
if (typeof Raptor.actionRedo === 'undefined' && typeof actionRedo !== 'undefined') Raptor.actionRedo = actionRedo;
if (typeof Raptor.actionUndo === 'undefined' && typeof actionUndo !== 'undefined') Raptor.actionUndo = actionUndo;
if (typeof Raptor.clean === 'undefined' && typeof clean !== 'undefined') Raptor.clean = clean;
if (typeof Raptor.cleanEmptyAttributes === 'undefined' && typeof cleanEmptyAttributes !== 'undefined') Raptor.cleanEmptyAttributes = cleanEmptyAttributes;
if (typeof Raptor.cleanEmptyElements === 'undefined' && typeof cleanEmptyElements !== 'undefined') Raptor.cleanEmptyElements = cleanEmptyElements;
if (typeof Raptor.cleanRemoveAttributes === 'undefined' && typeof cleanRemoveAttributes !== 'undefined') Raptor.cleanRemoveAttributes = cleanRemoveAttributes;
if (typeof Raptor.cleanRemoveComments === 'undefined' && typeof cleanRemoveComments !== 'undefined') Raptor.cleanRemoveComments = cleanRemoveComments;
if (typeof Raptor.cleanRemoveElements === 'undefined' && typeof cleanRemoveElements !== 'undefined') Raptor.cleanRemoveElements = cleanRemoveElements;
if (typeof Raptor.cleanReplaceElements === 'undefined' && typeof cleanReplaceElements !== 'undefined') Raptor.cleanReplaceElements = cleanReplaceElements;
if (typeof Raptor.cleanUnnestElement === 'undefined' && typeof cleanUnnestElement !== 'undefined') Raptor.cleanUnnestElement = cleanUnnestElement;
if (typeof Raptor.cleanUnwrapElements === 'undefined' && typeof cleanUnwrapElements !== 'undefined') Raptor.cleanUnwrapElements = cleanUnwrapElements;
if (typeof Raptor.cleanWrapTextNodes === 'undefined' && typeof cleanWrapTextNodes !== 'undefined') Raptor.cleanWrapTextNodes = cleanWrapTextNodes;
if (typeof Raptor.debug === 'undefined' && typeof debug !== 'undefined') Raptor.debug = debug;
if (typeof Raptor.dockToElement === 'undefined' && typeof dockToElement !== 'undefined') Raptor.dockToElement = dockToElement;
if (typeof Raptor.dockToScreen === 'undefined' && typeof dockToScreen !== 'undefined') Raptor.dockToScreen = dockToScreen;
if (typeof Raptor.elementBringToTop === 'undefined' && typeof elementBringToTop !== 'undefined') Raptor.elementBringToTop = elementBringToTop;
if (typeof Raptor.elementChangeTag === 'undefined' && typeof elementChangeTag !== 'undefined') Raptor.elementChangeTag = elementChangeTag;
if (typeof Raptor.elementClosestBlock === 'undefined' && typeof elementClosestBlock !== 'undefined') Raptor.elementClosestBlock = elementClosestBlock;
if (typeof Raptor.elementContainsBlockElement === 'undefined' && typeof elementContainsBlockElement !== 'undefined') Raptor.elementContainsBlockElement = elementContainsBlockElement;
if (typeof Raptor.elementDefaultDisplay === 'undefined' && typeof elementDefaultDisplay !== 'undefined') Raptor.elementDefaultDisplay = elementDefaultDisplay;
if (typeof Raptor.elementDetachedManip === 'undefined' && typeof elementDetachedManip !== 'undefined') Raptor.elementDetachedManip = elementDetachedManip;
if (typeof Raptor.elementFirstInvalidElementOfValidParent === 'undefined' && typeof elementFirstInvalidElementOfValidParent !== 'undefined') Raptor.elementFirstInvalidElementOfValidParent = elementFirstInvalidElementOfValidParent;
if (typeof Raptor.elementGetAttributes === 'undefined' && typeof elementGetAttributes !== 'undefined') Raptor.elementGetAttributes = elementGetAttributes;
if (typeof Raptor.elementGetStyles === 'undefined' && typeof elementGetStyles !== 'undefined') Raptor.elementGetStyles = elementGetStyles;
if (typeof Raptor.elementIsBlock === 'undefined' && typeof elementIsBlock !== 'undefined') Raptor.elementIsBlock = elementIsBlock;
if (typeof Raptor.elementIsEmpty === 'undefined' && typeof elementIsEmpty !== 'undefined') Raptor.elementIsEmpty = elementIsEmpty;
if (typeof Raptor.elementIsValid === 'undefined' && typeof elementIsValid !== 'undefined') Raptor.elementIsValid = elementIsValid;
if (typeof Raptor.elementOuterHtml === 'undefined' && typeof elementOuterHtml !== 'undefined') Raptor.elementOuterHtml = elementOuterHtml;
if (typeof Raptor.elementOuterText === 'undefined' && typeof elementOuterText !== 'undefined') Raptor.elementOuterText = elementOuterText;
if (typeof Raptor.elementPositionOver === 'undefined' && typeof elementPositionOver !== 'undefined') Raptor.elementPositionOver = elementPositionOver;
if (typeof Raptor.elementPositionUnder === 'undefined' && typeof elementPositionUnder !== 'undefined') Raptor.elementPositionUnder = elementPositionUnder;
if (typeof Raptor.elementRemoveAttributes === 'undefined' && typeof elementRemoveAttributes !== 'undefined') Raptor.elementRemoveAttributes = elementRemoveAttributes;
if (typeof Raptor.elementSwapStyles === 'undefined' && typeof elementSwapStyles !== 'undefined') Raptor.elementSwapStyles = elementSwapStyles;
if (typeof Raptor.elementToggleStyle === 'undefined' && typeof elementToggleStyle !== 'undefined') Raptor.elementToggleStyle = elementToggleStyle;
if (typeof Raptor.elementUniqueId === 'undefined' && typeof elementUniqueId !== 'undefined') Raptor.elementUniqueId = elementUniqueId;
if (typeof Raptor.elementVisibleRect === 'undefined' && typeof elementVisibleRect !== 'undefined') Raptor.elementVisibleRect = elementVisibleRect;
if (typeof Raptor.elementWrapInner === 'undefined' && typeof elementWrapInner !== 'undefined') Raptor.elementWrapInner = elementWrapInner;
if (typeof Raptor.eventEventable === 'undefined' && typeof eventEventable !== 'undefined') Raptor.eventEventable = eventEventable;
if (typeof Raptor.eventMouseEnter === 'undefined' && typeof eventMouseEnter !== 'undefined') Raptor.eventMouseEnter = eventMouseEnter;
if (typeof Raptor.eventMouseLeave === 'undefined' && typeof eventMouseLeave !== 'undefined') Raptor.eventMouseLeave = eventMouseLeave;
if (typeof Raptor.extendLocale === 'undefined' && typeof extendLocale !== 'undefined') Raptor.extendLocale = extendLocale;
if (typeof Raptor.formatBytes === 'undefined' && typeof formatBytes !== 'undefined') Raptor.formatBytes = formatBytes;
if (typeof Raptor.fragmentInsertBefore === 'undefined' && typeof fragmentInsertBefore !== 'undefined') Raptor.fragmentInsertBefore = fragmentInsertBefore;
if (typeof Raptor.fragmentToHtml === 'undefined' && typeof fragmentToHtml !== 'undefined') Raptor.fragmentToHtml = fragmentToHtml;
if (typeof Raptor.getLocalizedString === 'undefined' && typeof getLocalizedString !== 'undefined') Raptor.getLocalizedString = getLocalizedString;
if (typeof Raptor.handleError === 'undefined' && typeof handleError !== 'undefined') Raptor.handleError = handleError;
if (typeof Raptor.handleInvalidArgumentError === 'undefined' && typeof handleInvalidArgumentError !== 'undefined') Raptor.handleInvalidArgumentError = handleInvalidArgumentError;
if (typeof Raptor.info === 'undefined' && typeof info !== 'undefined') Raptor.info = info;
if (typeof Raptor.lazyLoad === 'undefined' && typeof lazyLoad !== 'undefined') Raptor.lazyLoad = lazyLoad;
if (typeof Raptor.listBreakAtSelection === 'undefined' && typeof listBreakAtSelection !== 'undefined') Raptor.listBreakAtSelection = listBreakAtSelection;
if (typeof Raptor.listBreakByReplacingSelection === 'undefined' && typeof listBreakByReplacingSelection !== 'undefined') Raptor.listBreakByReplacingSelection = listBreakByReplacingSelection;
if (typeof Raptor.listConvertItemsForList === 'undefined' && typeof listConvertItemsForList !== 'undefined') Raptor.listConvertItemsForList = listConvertItemsForList;
if (typeof Raptor.listConvertListItem === 'undefined' && typeof listConvertListItem !== 'undefined') Raptor.listConvertListItem = listConvertListItem;
if (typeof Raptor.listConvertListType === 'undefined' && typeof listConvertListType !== 'undefined') Raptor.listConvertListType = listConvertListType;
if (typeof Raptor.listEnforceValidChildren === 'undefined' && typeof listEnforceValidChildren !== 'undefined') Raptor.listEnforceValidChildren = listEnforceValidChildren;
if (typeof Raptor.listRemoveEmpty === 'undefined' && typeof listRemoveEmpty !== 'undefined') Raptor.listRemoveEmpty = listRemoveEmpty;
if (typeof Raptor.listRemoveEmptyItems === 'undefined' && typeof listRemoveEmptyItems !== 'undefined') Raptor.listRemoveEmptyItems = listRemoveEmptyItems;
if (typeof Raptor.listShouldConvertType === 'undefined' && typeof listShouldConvertType !== 'undefined') Raptor.listShouldConvertType = listShouldConvertType;
if (typeof Raptor.listShouldUnwrap === 'undefined' && typeof listShouldUnwrap !== 'undefined') Raptor.listShouldUnwrap = listShouldUnwrap;
if (typeof Raptor.listShouldWrap === 'undefined' && typeof listShouldWrap !== 'undefined') Raptor.listShouldWrap = listShouldWrap;
if (typeof Raptor.listTidyModified === 'undefined' && typeof listTidyModified !== 'undefined') Raptor.listTidyModified = listTidyModified;
if (typeof Raptor.listToggle === 'undefined' && typeof listToggle !== 'undefined') Raptor.listToggle = listToggle;
if (typeof Raptor.listUnwrap === 'undefined' && typeof listUnwrap !== 'undefined') Raptor.listUnwrap = listUnwrap;
if (typeof Raptor.listUnwrapSelectedListItems === 'undefined' && typeof listUnwrapSelectedListItems !== 'undefined') Raptor.listUnwrapSelectedListItems = listUnwrapSelectedListItems;
if (typeof Raptor.listUnwrapSelection === 'undefined' && typeof listUnwrapSelection !== 'undefined') Raptor.listUnwrapSelection = listUnwrapSelection;
if (typeof Raptor.listWrapSelection === 'undefined' && typeof listWrapSelection !== 'undefined') Raptor.listWrapSelection = listWrapSelection;
if (typeof Raptor.nodeClassSwitch === 'undefined' && typeof nodeClassSwitch !== 'undefined') Raptor.nodeClassSwitch = nodeClassSwitch;
if (typeof Raptor.nodeClosestByClassName === 'undefined' && typeof nodeClosestByClassName !== 'undefined') Raptor.nodeClosestByClassName = nodeClosestByClassName;
if (typeof Raptor.nodeFindParent === 'undefined' && typeof nodeFindParent !== 'undefined') Raptor.nodeFindParent = nodeFindParent;
if (typeof Raptor.nodeFindTextNodes === 'undefined' && typeof nodeFindTextNodes !== 'undefined') Raptor.nodeFindTextNodes = nodeFindTextNodes;
if (typeof Raptor.nodeFindUnnested === 'undefined' && typeof nodeFindUnnested !== 'undefined') Raptor.nodeFindUnnested = nodeFindUnnested;
if (typeof Raptor.nodeFreezeHeight === 'undefined' && typeof nodeFreezeHeight !== 'undefined') Raptor.nodeFreezeHeight = nodeFreezeHeight;
if (typeof Raptor.nodeFromHtml === 'undefined' && typeof nodeFromHtml !== 'undefined') Raptor.nodeFromHtml = nodeFromHtml;
if (typeof Raptor.nodeIsChildOf === 'undefined' && typeof nodeIsChildOf !== 'undefined') Raptor.nodeIsChildOf = nodeIsChildOf;
if (typeof Raptor.nodeLastChild === 'undefined' && typeof nodeLastChild !== 'undefined') Raptor.nodeLastChild = nodeLastChild;
if (typeof Raptor.nodeMatches === 'undefined' && typeof nodeMatches !== 'undefined') Raptor.nodeMatches = nodeMatches;
if (typeof Raptor.nodeOffsetTop === 'undefined' && typeof nodeOffsetTop !== 'undefined') Raptor.nodeOffsetTop = nodeOffsetTop;
if (typeof Raptor.nodeUnfreezeHeight === 'undefined' && typeof nodeUnfreezeHeight !== 'undefined') Raptor.nodeUnfreezeHeight = nodeUnfreezeHeight;
if (typeof Raptor.nodeUniqueId === 'undefined' && typeof nodeUniqueId !== 'undefined') Raptor.nodeUniqueId = nodeUniqueId;
if (typeof Raptor.persistGet === 'undefined' && typeof persistGet !== 'undefined') Raptor.persistGet = persistGet;
if (typeof Raptor.persistSet === 'undefined' && typeof persistSet !== 'undefined') Raptor.persistSet = persistSet;
if (typeof Raptor.pluginPluggable === 'undefined' && typeof pluginPluggable !== 'undefined') Raptor.pluginPluggable = pluginPluggable;
if (typeof Raptor.pluginPrepare === 'undefined' && typeof pluginPrepare !== 'undefined') Raptor.pluginPrepare = pluginPrepare;
if (typeof Raptor.rangeContainsNode === 'undefined' && typeof rangeContainsNode !== 'undefined') Raptor.rangeContainsNode = rangeContainsNode;
if (typeof Raptor.rangeContainsNodeText === 'undefined' && typeof rangeContainsNodeText !== 'undefined') Raptor.rangeContainsNodeText = rangeContainsNodeText;
if (typeof Raptor.rangeDeserialize === 'undefined' && typeof rangeDeserialize !== 'undefined') Raptor.rangeDeserialize = rangeDeserialize;
if (typeof Raptor.rangeEmptyTag === 'undefined' && typeof rangeEmptyTag !== 'undefined') Raptor.rangeEmptyTag = rangeEmptyTag;
if (typeof Raptor.rangeExpandTo === 'undefined' && typeof rangeExpandTo !== 'undefined') Raptor.rangeExpandTo = rangeExpandTo;
if (typeof Raptor.rangeExpandToParent === 'undefined' && typeof rangeExpandToParent !== 'undefined') Raptor.rangeExpandToParent = rangeExpandToParent;
if (typeof Raptor.rangeGet === 'undefined' && typeof rangeGet !== 'undefined') Raptor.rangeGet = rangeGet;
if (typeof Raptor.rangeGetCommonAncestor === 'undefined' && typeof rangeGetCommonAncestor !== 'undefined') Raptor.rangeGetCommonAncestor = rangeGetCommonAncestor;
if (typeof Raptor.rangeGetEndElement === 'undefined' && typeof rangeGetEndElement !== 'undefined') Raptor.rangeGetEndElement = rangeGetEndElement;
if (typeof Raptor.rangeGetStartElement === 'undefined' && typeof rangeGetStartElement !== 'undefined') Raptor.rangeGetStartElement = rangeGetStartElement;
if (typeof Raptor.rangeIsContainedBy === 'undefined' && typeof rangeIsContainedBy !== 'undefined') Raptor.rangeIsContainedBy = rangeIsContainedBy;
if (typeof Raptor.rangeIsEmpty === 'undefined' && typeof rangeIsEmpty !== 'undefined') Raptor.rangeIsEmpty = rangeIsEmpty;
if (typeof Raptor.rangeReplace === 'undefined' && typeof rangeReplace !== 'undefined') Raptor.rangeReplace = rangeReplace;
if (typeof Raptor.rangeReplaceSplitInvalidTags === 'undefined' && typeof rangeReplaceSplitInvalidTags !== 'undefined') Raptor.rangeReplaceSplitInvalidTags = rangeReplaceSplitInvalidTags;
if (typeof Raptor.rangeReplaceWithinValidTags === 'undefined' && typeof rangeReplaceWithinValidTags !== 'undefined') Raptor.rangeReplaceWithinValidTags = rangeReplaceWithinValidTags;
if (typeof Raptor.rangeSelectElement === 'undefined' && typeof rangeSelectElement !== 'undefined') Raptor.rangeSelectElement = rangeSelectElement;
if (typeof Raptor.rangeSelectElementContent === 'undefined' && typeof rangeSelectElementContent !== 'undefined') Raptor.rangeSelectElementContent = rangeSelectElementContent;
if (typeof Raptor.rangeSerialize === 'undefined' && typeof rangeSerialize !== 'undefined') Raptor.rangeSerialize = rangeSerialize;
if (typeof Raptor.rangeToHtml === 'undefined' && typeof rangeToHtml !== 'undefined') Raptor.rangeToHtml = rangeToHtml;
if (typeof Raptor.rangeTrim === 'undefined' && typeof rangeTrim !== 'undefined') Raptor.rangeTrim = rangeTrim;
if (typeof Raptor.registerLocale === 'undefined' && typeof registerLocale !== 'undefined') Raptor.registerLocale = registerLocale;
if (typeof Raptor.selectionAtEndOfElement === 'undefined' && typeof selectionAtEndOfElement !== 'undefined') Raptor.selectionAtEndOfElement = selectionAtEndOfElement;
if (typeof Raptor.selectionAtStartOfElement === 'undefined' && typeof selectionAtStartOfElement !== 'undefined') Raptor.selectionAtStartOfElement = selectionAtStartOfElement;
if (typeof Raptor.selectionChangeTags === 'undefined' && typeof selectionChangeTags !== 'undefined') Raptor.selectionChangeTags = selectionChangeTags;
if (typeof Raptor.selectionClearFormatting === 'undefined' && typeof selectionClearFormatting !== 'undefined') Raptor.selectionClearFormatting = selectionClearFormatting;
if (typeof Raptor.selectionConstrain === 'undefined' && typeof selectionConstrain !== 'undefined') Raptor.selectionConstrain = selectionConstrain;
if (typeof Raptor.selectionContains === 'undefined' && typeof selectionContains !== 'undefined') Raptor.selectionContains = selectionContains;
if (typeof Raptor.selectionDelete === 'undefined' && typeof selectionDelete !== 'undefined') Raptor.selectionDelete = selectionDelete;
if (typeof Raptor.selectionDestroy === 'undefined' && typeof selectionDestroy !== 'undefined') Raptor.selectionDestroy = selectionDestroy;
if (typeof Raptor.selectionEachBlock === 'undefined' && typeof selectionEachBlock !== 'undefined') Raptor.selectionEachBlock = selectionEachBlock;
if (typeof Raptor.selectionEachRange === 'undefined' && typeof selectionEachRange !== 'undefined') Raptor.selectionEachRange = selectionEachRange;
if (typeof Raptor.selectionExists === 'undefined' && typeof selectionExists !== 'undefined') Raptor.selectionExists = selectionExists;
if (typeof Raptor.selectionExpandTo === 'undefined' && typeof selectionExpandTo !== 'undefined') Raptor.selectionExpandTo = selectionExpandTo;
if (typeof Raptor.selectionExpandToWord === 'undefined' && typeof selectionExpandToWord !== 'undefined') Raptor.selectionExpandToWord = selectionExpandToWord;
if (typeof Raptor.selectionFindWrappingAndInnerElements === 'undefined' && typeof selectionFindWrappingAndInnerElements !== 'undefined') Raptor.selectionFindWrappingAndInnerElements = selectionFindWrappingAndInnerElements;
if (typeof Raptor.selectionGetElement === 'undefined' && typeof selectionGetElement !== 'undefined') Raptor.selectionGetElement = selectionGetElement;
if (typeof Raptor.selectionGetElements === 'undefined' && typeof selectionGetElements !== 'undefined') Raptor.selectionGetElements = selectionGetElements;
if (typeof Raptor.selectionGetEndElement === 'undefined' && typeof selectionGetEndElement !== 'undefined') Raptor.selectionGetEndElement = selectionGetEndElement;
if (typeof Raptor.selectionGetHtml === 'undefined' && typeof selectionGetHtml !== 'undefined') Raptor.selectionGetHtml = selectionGetHtml;
if (typeof Raptor.selectionGetStartElement === 'undefined' && typeof selectionGetStartElement !== 'undefined') Raptor.selectionGetStartElement = selectionGetStartElement;
if (typeof Raptor.selectionInverseWrapWithTagClass === 'undefined' && typeof selectionInverseWrapWithTagClass !== 'undefined') Raptor.selectionInverseWrapWithTagClass = selectionInverseWrapWithTagClass;
if (typeof Raptor.selectionIsEmpty === 'undefined' && typeof selectionIsEmpty !== 'undefined') Raptor.selectionIsEmpty = selectionIsEmpty;
if (typeof Raptor.selectionRange === 'undefined' && typeof selectionRange !== 'undefined') Raptor.selectionRange = selectionRange;
if (typeof Raptor.selectionReplace === 'undefined' && typeof selectionReplace !== 'undefined') Raptor.selectionReplace = selectionReplace;
if (typeof Raptor.selectionReplaceSplittingSelectedElement === 'undefined' && typeof selectionReplaceSplittingSelectedElement !== 'undefined') Raptor.selectionReplaceSplittingSelectedElement = selectionReplaceSplittingSelectedElement;
if (typeof Raptor.selectionReplaceWithinValidTags === 'undefined' && typeof selectionReplaceWithinValidTags !== 'undefined') Raptor.selectionReplaceWithinValidTags = selectionReplaceWithinValidTags;
if (typeof Raptor.selectionRestore === 'undefined' && typeof selectionRestore !== 'undefined') Raptor.selectionRestore = selectionRestore;
if (typeof Raptor.selectionSave === 'undefined' && typeof selectionSave !== 'undefined') Raptor.selectionSave = selectionSave;
if (typeof Raptor.selectionSaved === 'undefined' && typeof selectionSaved !== 'undefined') Raptor.selectionSaved = selectionSaved;
if (typeof Raptor.selectionSelectEdge === 'undefined' && typeof selectionSelectEdge !== 'undefined') Raptor.selectionSelectEdge = selectionSelectEdge;
if (typeof Raptor.selectionSelectEnd === 'undefined' && typeof selectionSelectEnd !== 'undefined') Raptor.selectionSelectEnd = selectionSelectEnd;
if (typeof Raptor.selectionSelectInner === 'undefined' && typeof selectionSelectInner !== 'undefined') Raptor.selectionSelectInner = selectionSelectInner;
if (typeof Raptor.selectionSelectOuter === 'undefined' && typeof selectionSelectOuter !== 'undefined') Raptor.selectionSelectOuter = selectionSelectOuter;
if (typeof Raptor.selectionSelectStart === 'undefined' && typeof selectionSelectStart !== 'undefined') Raptor.selectionSelectStart = selectionSelectStart;
if (typeof Raptor.selectionSelectToEndOfElement === 'undefined' && typeof selectionSelectToEndOfElement !== 'undefined') Raptor.selectionSelectToEndOfElement = selectionSelectToEndOfElement;
if (typeof Raptor.selectionSet === 'undefined' && typeof selectionSet !== 'undefined') Raptor.selectionSet = selectionSet;
if (typeof Raptor.selectionToggleBlockClasses === 'undefined' && typeof selectionToggleBlockClasses !== 'undefined') Raptor.selectionToggleBlockClasses = selectionToggleBlockClasses;
if (typeof Raptor.selectionToggleBlockStyle === 'undefined' && typeof selectionToggleBlockStyle !== 'undefined') Raptor.selectionToggleBlockStyle = selectionToggleBlockStyle;
if (typeof Raptor.selectionToggleWrapper === 'undefined' && typeof selectionToggleWrapper !== 'undefined') Raptor.selectionToggleWrapper = selectionToggleWrapper;
if (typeof Raptor.selectionTrim === 'undefined' && typeof selectionTrim !== 'undefined') Raptor.selectionTrim = selectionTrim;
if (typeof Raptor.selectionWrapTagWithAttribute === 'undefined' && typeof selectionWrapTagWithAttribute !== 'undefined') Raptor.selectionWrapTagWithAttribute = selectionWrapTagWithAttribute;
if (typeof Raptor.setLocale === 'undefined' && typeof setLocale !== 'undefined') Raptor.setLocale = setLocale;
if (typeof Raptor.stateCheckDirty === 'undefined' && typeof stateCheckDirty !== 'undefined') Raptor.stateCheckDirty = stateCheckDirty;
if (typeof Raptor.stateRestore === 'undefined' && typeof stateRestore !== 'undefined') Raptor.stateRestore = stateRestore;
if (typeof Raptor.stateSave === 'undefined' && typeof stateSave !== 'undefined') Raptor.stateSave = stateSave;
if (typeof Raptor.stateSetDirty === 'undefined' && typeof stateSetDirty !== 'undefined') Raptor.stateSetDirty = stateSetDirty;
if (typeof Raptor.stringFromCamelCase === 'undefined' && typeof stringFromCamelCase !== 'undefined') Raptor.stringFromCamelCase = stringFromCamelCase;
if (typeof Raptor.stringHash === 'undefined' && typeof stringHash !== 'undefined') Raptor.stringHash = stringHash;
if (typeof Raptor.stringHtmlStringIsEmpty === 'undefined' && typeof stringHtmlStringIsEmpty !== 'undefined') Raptor.stringHtmlStringIsEmpty = stringHtmlStringIsEmpty;
if (typeof Raptor.stringStripTags === 'undefined' && typeof stringStripTags !== 'undefined') Raptor.stringStripTags = stringStripTags;
if (typeof Raptor.stringToCamelCase === 'undefined' && typeof stringToCamelCase !== 'undefined') Raptor.stringToCamelCase = stringToCamelCase;
if (typeof Raptor.stringUcFirst === 'undefined' && typeof stringUcFirst !== 'undefined') Raptor.stringUcFirst = stringUcFirst;
if (typeof Raptor.styleRestoreState === 'undefined' && typeof styleRestoreState !== 'undefined') Raptor.styleRestoreState = styleRestoreState;
if (typeof Raptor.styleSwapState === 'undefined' && typeof styleSwapState !== 'undefined') Raptor.styleSwapState = styleSwapState;
if (typeof Raptor.styleSwapWithWrapper === 'undefined' && typeof styleSwapWithWrapper !== 'undefined') Raptor.styleSwapWithWrapper = styleSwapWithWrapper;
if (typeof Raptor.tableCanMergeCells === 'undefined' && typeof tableCanMergeCells !== 'undefined') Raptor.tableCanMergeCells = tableCanMergeCells;
if (typeof Raptor.tableCanSplitCells === 'undefined' && typeof tableCanSplitCells !== 'undefined') Raptor.tableCanSplitCells = tableCanSplitCells;
if (typeof Raptor.tableCellsInRange === 'undefined' && typeof tableCellsInRange !== 'undefined') Raptor.tableCellsInRange = tableCellsInRange;
if (typeof Raptor.tableCreate === 'undefined' && typeof tableCreate !== 'undefined') Raptor.tableCreate = tableCreate;
if (typeof Raptor.tableDeleteColumn === 'undefined' && typeof tableDeleteColumn !== 'undefined') Raptor.tableDeleteColumn = tableDeleteColumn;
if (typeof Raptor.tableDeleteRow === 'undefined' && typeof tableDeleteRow !== 'undefined') Raptor.tableDeleteRow = tableDeleteRow;
if (typeof Raptor.tableGetCellByIndex === 'undefined' && typeof tableGetCellByIndex !== 'undefined') Raptor.tableGetCellByIndex = tableGetCellByIndex;
if (typeof Raptor.tableGetCellIndex === 'undefined' && typeof tableGetCellIndex !== 'undefined') Raptor.tableGetCellIndex = tableGetCellIndex;
if (typeof Raptor.tableInsertColumn === 'undefined' && typeof tableInsertColumn !== 'undefined') Raptor.tableInsertColumn = tableInsertColumn;
if (typeof Raptor.tableInsertRow === 'undefined' && typeof tableInsertRow !== 'undefined') Raptor.tableInsertRow = tableInsertRow;
if (typeof Raptor.tableIsEmpty === 'undefined' && typeof tableIsEmpty !== 'undefined') Raptor.tableIsEmpty = tableIsEmpty;
if (typeof Raptor.tableMergeCells === 'undefined' && typeof tableMergeCells !== 'undefined') Raptor.tableMergeCells = tableMergeCells;
if (typeof Raptor.tableSplitCells === 'undefined' && typeof tableSplitCells !== 'undefined') Raptor.tableSplitCells = tableSplitCells;
if (typeof Raptor.templateConvertTokens === 'undefined' && typeof templateConvertTokens !== 'undefined') Raptor.templateConvertTokens = templateConvertTokens;
if (typeof Raptor.templateGet === 'undefined' && typeof templateGet !== 'undefined') Raptor.templateGet = templateGet;
if (typeof Raptor.templateGetVariables === 'undefined' && typeof templateGetVariables !== 'undefined') Raptor.templateGetVariables = templateGetVariables;
if (typeof Raptor.templateRegister === 'undefined' && typeof templateRegister !== 'undefined') Raptor.templateRegister = templateRegister;
if (typeof Raptor.toolbarLayout === 'undefined' && typeof toolbarLayout !== 'undefined') Raptor.toolbarLayout = toolbarLayout;
if (typeof Raptor.tr === 'undefined' && typeof tr !== 'undefined') Raptor.tr = tr;
if (typeof Raptor.typeIsArray === 'undefined' && typeof typeIsArray !== 'undefined') Raptor.typeIsArray = typeIsArray;
if (typeof Raptor.typeIsElement === 'undefined' && typeof typeIsElement !== 'undefined') Raptor.typeIsElement = typeIsElement;
if (typeof Raptor.typeIsJQueryCompatible === 'undefined' && typeof typeIsJQueryCompatible !== 'undefined') Raptor.typeIsJQueryCompatible = typeIsJQueryCompatible;
if (typeof Raptor.typeIsNode === 'undefined' && typeof typeIsNode !== 'undefined') Raptor.typeIsNode = typeIsNode;
if (typeof Raptor.typeIsNumber === 'undefined' && typeof typeIsNumber !== 'undefined') Raptor.typeIsNumber = typeIsNumber;
if (typeof Raptor.typeIsRange === 'undefined' && typeof typeIsRange !== 'undefined') Raptor.typeIsRange = typeIsRange;
if (typeof Raptor.typeIsSelection === 'undefined' && typeof typeIsSelection !== 'undefined') Raptor.typeIsSelection = typeIsSelection;
if (typeof Raptor.typeIsString === 'undefined' && typeof typeIsString !== 'undefined') Raptor.typeIsString = typeIsString;
if (typeof Raptor.typeIsTextNode === 'undefined' && typeof typeIsTextNode !== 'undefined') Raptor.typeIsTextNode = typeIsTextNode;
if (typeof Raptor.undockFromElement === 'undefined' && typeof undockFromElement !== 'undefined') Raptor.undockFromElement = undockFromElement;
if (typeof Raptor.undockFromScreen === 'undefined' && typeof undockFromScreen !== 'undefined') Raptor.undockFromScreen = undockFromScreen;
window.Raptor = Raptor;
// </expose>
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/expose.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/cancel/cancel.js
/**
 * @fileOverview Contains the cancel editing dialog code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of a cancel dialog.
 *
 * @todo needs checking and not sure what to put in for the param stuff.
 * @param {type} param
 */
Raptor.registerUi(new DialogButton({
    name: 'cancel',
    hotkey: 'esc',
    dialogOptions: {
        width: 500
    },

    action: function() {
        if (this.raptor.isDirty()) {
            DialogButton.prototype.action.call(this);
        } else {
            this.applyAction();
        }
    },

    applyAction: function() {
        this.raptor.cancelEditing();
    },

    getDialogTemplate: function() {
        return $('<div>').html(tr('cancelDialogContent'));
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/cancel/cancel.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/class-menu/class-menu.js
/**
 * @fileOverview Contains the class menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The select menu class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options
 */
function ClassMenu(options) {
    SelectMenu.call(this, {
        name: 'classMenu'
    });
}

ClassMenu.prototype = Object.create(SelectMenu.prototype);

/**
 * Initialises the class menu.
 *
 * @todo type and desc for result
 * @returns {unresolved} result
 */
ClassMenu.prototype.init = function() {
    var result = SelectMenu.prototype.init.call(this);
    if (typeof this.options.classes === 'object' &&
            Object.keys(this.options.classes).length > 0) {
        this.raptor.bind('selectionChange', this.updateButton.bind(this));
        return result;
    }
};

/**
 * Toggles a given set of classes on a selection.
 *
 * @param {Object} classes
 */
ClassMenu.prototype.changeClass = function(classes) {
    selectionToggleBlockClasses(classes, [], this.raptor.getElement());
};

/**
 * Applies the class on click.
 *
 * @param event
 */
ClassMenu.prototype.menuItemClick = function(event) {
    SelectMenu.prototype.menuItemClick.apply(this, arguments);
    this.raptor.actionApply(function() {
        this.changeClass([$(event.currentTarget).data('value')]);
    }.bind(this));
};

/**
 * Puts the selection into preview mode for the chosen class.
 *
 * @param event The mouse event which triggered the preview.
 */
ClassMenu.prototype.menuItemMouseEnter = function(event) {
    this.raptor.actionPreview(function() {
        this.changeClass([$(event.currentTarget).data('value')]);
    }.bind(this));
};

/**
 * Restores the selection from preview mode.
 *
 * @param event
 */
ClassMenu.prototype.menuItemMouseLeave = function(event) {
    this.raptor.actionPreviewRestore();
};
 /**
  * Updates the class menu button.
  */
ClassMenu.prototype.updateButton = function() {
};

//ClassMenu.prototype.getButton = function() {
//    if (!this.button) {
//        this.button = new Button({
//            name: this.name,
//            action: this.show.bind(this),
//            preview: false,
//            options: this.options,
//            icon: false,
//            text: 'Class Selector',
//            raptor: this.raptor
//        });
//    }
//    return this.button;
//};

/**
 * Prepare and return the menu items to be used in the Raptor UI.
 * @returns {Object} The menu items.
 */
ClassMenu.prototype.getMenuItems = function() {
    var items = '';
    for (var label in this.options.classes) {
        items += this.raptor.getTemplate('class-menu.item', {
            label: label,
            value: this.options.classes[label]
        });
    }
    return items;
};

Raptor.registerUi(new ClassMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/class-menu/class-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/clean-block/clean-block.js
/**
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 */

Raptor.registerUi(new PreviewButton({
    name: 'cleanBlock',
    action: function() {
        var element = this.raptor.getElement();
        cleanRemoveAttributes(element, [
            'style'
        ]);
        cleanRemoveElements(element, [
            'font',
            'span:not([class])',
            '.cms-color:has(.cms-color)',
            ':header strong',
            ':header b',
            ':header strong'
        ]);
        cleanEmptyElements(element, [
            'b',
            'big',
            'em',
            'i',
            'small',
            'span',
            'strong',
            ':not(:visible)'
        ]);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/clean-block/clean-block.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/clear-formatting/clear-formatting.js
/**
 * @fileOverview Contains the clear formatting button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the preview button that clears the
 * formatting on a selection.
 */
Raptor.registerUi(new PreviewButton({
    name: 'clearFormatting',
    action: function() {
        selectionClearFormatting(this.raptor.getElement().get(0));
        cleanEmptyElements(this.raptor.getElement(), [
            'a', 'b', 'i', 'sub', 'sup', 'strong', 'em', 'big', 'small', 'p'
        ]);
        cleanWrapTextNodes(this.raptor.getElement()[0], 'p');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/clear-formatting/clear-formatting.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/click-button-to-edit/click-button-to-edit.js
/**
 * @fileOverview Contains the click button to edit code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */
Raptor.registerUi(new Button({
    name: 'clickButtonToEdit',
    action: function() {
        this.raptor.enableEditing();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/click-button-to-edit/click-button-to-edit.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/close/close.js
/**
 * @fileOverview Contains the close panel code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 */
Raptor.registerUi(new Button({
    name: 'close',

    click: function() {
        this.layout.close();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/close/close.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/color-menu-basic/color-menu-basic.js
/**
 * @fileOverview Contains the basic colour menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author  David Neilsen <david@panmedia.co.nz>
 * @author  Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The basic colour menu class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options
 */
function ColorMenuBasic(options) {
    this.options = {
        colors: {
            white: '#ffffff',
            black: '#000000',
            grey: '#999',
            blue: '#4f81bd',
            red: '#c0504d',
            green: '#9bbb59',
            purple: '#8064a2',
            orange: '#f79646'
        }
    };
    /**
     * Cache the current color so it can be reapplied to the button if the user
     * clicks the button to open the menu, hovers some colors then clicks off to
     * close it.
     *
     * @type {String}
     */
    this.currentColor = 'automatic';
    SelectMenu.call(this, {
        name: 'colorMenuBasic'
    });
}

ColorMenuBasic.prototype = Object.create(SelectMenu.prototype);

/**
 * Initialize the basic colour menu.
 *
 * @returns {Element}
 */
ColorMenuBasic.prototype.init = function() {
    this.raptor.bind('selectionChange', this.updateButton.bind(this));
    this.updateButton();
    return SelectMenu.prototype.init.apply(this, arguments);
};

/**
 * Updates the basic colour menu with the current colour.
 */
ColorMenuBasic.prototype.updateButton = function() {
    var tag = selectionGetElements()[0],
        button = this.getButton().getButton(),
        color = null,
        closest = null;

    // TODO: set automatic icon color to the color of the text
    aButtonSetLabel(button, tr('colorMenuBasicAutomatic'));
    aButtonSetIcon(button, false);
    if (!tag) {
        return;
    }
    tag = $(tag);
    for (var label in this.options.colors) {
        closest = $(tag).closest('.' + this.options.cssPrefix + label);
        if (closest.length) {
            color = label;
            break;
        }
    }
    if (color) {
        aButtonSetLabel(button, tr('colorMenuBasic' + stringToCamelCase(color)));
        aButtonSetIcon(button, 'ui-icon-swatch');
        // FIXME: set color in an adapter friendly way
        button.find('.ui-icon').css('background-color', closest.css('color'));
        return;
    }
};

/**
 * Changes the colour of the selection.
 *
 * @param {type} color The current colour.
 */
ColorMenuBasic.prototype.changeColor = function(color, permanent) {
    if (permanent) {
        this.currentColor = color;
    }
    this.raptor.actionApply(function() {
        selectionExpandToWord();
        if (color === 'automatic') {
            selectionGetElements().parents('.' + this.options.cssPrefix + 'color').addBack().each(function() {
                var classes = $(this).attr('class');
                if (classes === null || typeof classes === 'undefined') {
                    return;
                }
                classes = classes.match(/(cms-(.*?))( |$)/ig);
                if (classes === null || typeof classes === 'undefined') {
                    return;
                }
                for (var i = 0, l = classes.length; i < l; i++) {
                    $(this).removeClass(classes[i].trim());
                    if (!$(this).attr('class').trim()) {
                        $(this).contents().unwrap();
                    }
                }
            });
        } else {
            var uniqueId = elementUniqueId();
            selectionToggleWrapper('span', {
                classes: this.options.cssPrefix + 'color ' + this.options.cssPrefix + color,
                attributes: {
                    id: uniqueId
                }
            });
            var element = $('#' + uniqueId);
            if (element.length) {
                selectionSelectInner(element.removeAttr('id').get(0));
                var splitNode;
                do {
                    splitNode = $('#' + uniqueId);
                    splitNode.removeAttr('id');
                } while (splitNode.length);
            }
        }
        cleanRemoveElements(this.raptor.getElement(), [
            '.cms-color:has(.cms-color)'
        ]);
    }.bind(this));
};

/**
 * The preview state for the basic colour menu.
 *
 * @param event The mouse event which triggered the preview.
 */
ColorMenuBasic.prototype.menuItemMouseEnter = function(event) {
    this.raptor.actionPreview(function() {
        this.changeColor($(event.currentTarget).data('color'));
    }.bind(this));
};

/**
 * Restores the selection from the preview.
 *
 * @param event
 */
ColorMenuBasic.prototype.menuItemMouseLeave = function(event) {
    this.raptor.actionPreviewRestore();
};

/**
 * Applies the colour change to the selection.
 *
 * @param event The mouse event to trigger the application of the colour.
 */
ColorMenuBasic.prototype.menuItemClick = function(event) {
    SelectMenu.prototype.menuItemClick.apply(this, arguments);
    this.raptor.actionApply(function() {
        this.changeColor($(event.currentTarget).data('color'), true);
    }.bind(this));
};

/**
 * Prepare and return the menu items to be used in the Raptor UI.
 * @returns {Element} The menu items.
 */
ColorMenuBasic.prototype.getMenuItems = function() {
    var template = this.raptor.getTemplate('color-menu-basic.automatic', this.options);
    for (var label in this.options.colors) {
        template += this.raptor.getTemplate('color-menu-basic.item', {
            color: this.options.colors[label],
            label: tr('colorMenuBasic' + stringToCamelCase(label)),
            className: label,
            baseClass: this.options.baseClass
        });
    }
    return template;
};

Raptor.registerUi(new ColorMenuBasic());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/color-menu-basic/color-menu-basic.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-plugin.js
/**
 * @fileOverview Contains the dock plugin class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The dock plugin class.
 *
 * @constructor
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides
 */
function DockPlugin(name, overrides) {
    this.options = {
        dockToElement: false,
        docked: false,
        position: 'top',
        spacer: true,
        persist: true,
        dockTo: null
    };
    this.dockState = false;
    this.marker = false;

    RaptorPlugin.call(this, name || 'dock', overrides);
}

DockPlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Initialize the dock plugin.
 */
DockPlugin.prototype.init = function() {
    var docked;
    if (this.options.persist) {
        docked = this.raptor.persist('docked');
    }
    if (typeof docked === 'undefined') {
        docked = this.options.docked;
    }
    if (typeof docked === 'undefined') {
        docked = false;
    }
    if (docked) {
        this.raptor.bind('toolbarReady', function() {
            if (docked) {
                this.toggleState();
            }
        }.bind(this));
        this.raptor.bind('toolbarHide', function() {
            if (this.dockState && this.dockState.spacer) {
                this.dockState.spacer.addClass(this.options.baseClass + '-hidden');
                this.dockState.spacer.removeClass(this.options.baseClass + '-visible');
            }
        }.bind(this));
        this.raptor.bind('toolbarShow', function() {
            if (this.dockState && this.dockState.spacer) {
                this.dockState.spacer.removeClass(this.options.baseClass + '-hidden');
                this.dockState.spacer.addClass(this.options.baseClass + '-visible');
            }
        }.bind(this));
        this.raptor.bind('toolbarDestroy', function() {
            if (this.dockState && this.dockState.spacer) {
                this.dockState.spacer.remove();
            }
        }.bind(this));
    }
};

/**
 * Switch between docked / undocked, depending on options.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.toggleState = function() {
    if (this.options.dockToElement) {
        return this.toggleDockToElement();
    }
    return this.toggleDockToScreen();
};

/**
 * Gets the dock state on toggle dock to element.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.toggleDockToElement = function() {
    if (this.dockState) {
        if (typeof this.dockState.dockedTo !== 'undefined') {
            this.undockFromElement();
        } else {
            this.undockFromScreen();
            this.dockToElement();
        }
    } else {
        this.dockToElement();
    }
};

/**
 * Gets the dock state on dock to element.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.dockToElement = function() {
    var element = this.options.dockTo ? $(this.options.dockTo) : this.raptor.getElement(),
        layoutElement = this.raptor.getLayout('toolbar').getElement();
    this.marker = $('<marker>').addClass(this.options.baseClass + '-marker').insertAfter(layoutElement);
    layoutElement.addClass(this.options.baseClass + '-docked-to-element');
    this.dockState = dockToElement(layoutElement, element, {
        position: this.options.position,
        spacer: false,
        wrapperClass: this.options.baseClass + '-inline-wrapper'
    });
    this.activateButton(this.raptor.getPlugin('dockToElement'));
    this.raptor.persist('docked', true);
};

/**
 * Gets the dock state on undocking from an element.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.undockFromElement = function() {
    this.marker.replaceWith(undockFromElement(this.dockState));
    this.dockState = null;
    this.raptor.getLayout('toolbar').getElement().removeClass(this.options.baseClass + '-docked-to-element');
    this.deactivateButton(this.raptor.getPlugin('dockToElement'));
    this.raptor.persist('docked', false);
};

/**
 * Gets the dock state on toggle dock to screen.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.toggleDockToScreen = function() {
    if (this.dockState) {
        if (typeof this.dockState.dockedTo !== 'undefined') {
            this.undockFromElement();
            this.dockToScreen();
        } else {
            this.undockFromScreen();
        }
    } else {
        this.dockToScreen();
    }
};

/**
 * Gets the dock state on dock to screen.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.dockToScreen = function() {
    if (!this.dockState) {
        var layout = this.raptor.getLayout('toolbar');
        if (layout.isReady()) {
            var layoutElement = layout.getElement();
            this.marker = $('<marker>').addClass(this.options.baseClass + '-marker')
                                .insertAfter(layoutElement);
            layoutElement.addClass(this.options.baseClass + '-docked');
            layout.disableDragging();
            this.dockState = dockToScreen(layoutElement, {
                position: this.options.position,
                spacer: this.options.spacer,
                under: this.options.under
            });
            if (!layout.isVisible()) {
                this.dockState.spacer.removeClass(this.options.baseClass + '-visible');
                this.dockState.spacer.addClass(this.options.baseClass + '-hidden');
            }
            this.activateButton(this.raptor.getPlugin('dockToScreen'));
            this.raptor.persist('docked', true);
        }
    }
};

/**
 * Gets the dock state on undocking from the screen.
 *
 * @return {Object} Resulting dock state
 */
DockPlugin.prototype.undockFromScreen = function() {
    if (this.dockState) {
        var layout = this.raptor.getLayout('toolbar'),
            layoutElement = undockFromScreen(this.dockState);
        this.marker.replaceWith(layoutElement);
        layout.enableDragging();
        layout.constrainPosition();
        this.dockState = null;
        layoutElement.removeClass(this.options.baseClass + '-docked');
        this.deactivateButton(this.raptor.getPlugin('dockToScreen'));
        this.raptor.persist('docked', false);
    }
};

DockPlugin.prototype.deactivateButton = function(ui) {
    if (typeof ui !== 'undefined' &&
            typeof ui.button !== 'undefined') {
        aButtonInactive(ui.button);
    }
};

DockPlugin.prototype.activateButton = function(ui) {
    if (typeof ui !== 'undefined' &&
            typeof ui.button !== 'undefined') {
        aButtonActive(ui.button);
    }
};

Raptor.registerPlugin(new DockPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-plugin.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-to-screen.js
/**
 * @fileOverview Contains the dock to screen button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the dock to screen button for use in the Raptor UI.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new Button({
    name: 'dockToScreen',
    action: function() {
        this.raptor.unify(function(raptor) {
            raptor.plugins.dock.toggleDockToScreen();
        });
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-to-screen.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-to-element.js
/**
 * @fileOverview Contains the dock to element button code.
 * @author  David Neilsen <david@panmedia.co.nz>
 * @author  Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the dock to element button for use in the raptor UI.
 *
 * @todo not sure how to document this one.
 * @param {type} param
 */
Raptor.registerUi(new Button({
    name: 'dockToElement',
    action: function() {
        this.raptor.unify(function(raptor) {
            raptor.plugins.dock.toggleDockToElement();
        });
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/dock/dock-to-element.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/embed/embed.js
/**
 * @fileOverview Contains the embed dialog button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an intance of the embed dialog for use in the Raptor UI.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new DialogButton({
    name: 'embed',
    state: null,
    dialogOptions: {
        width: 600,
        height: 400
    },

    /**
     * Replace selection with embed textarea content.
     *
     * @param  {Element} dialog
     */
    applyAction: function(dialog) {
        this.raptor.actionApply(function() {
            selectionReplace(dialog.find('textarea').val());
        });
    },

    /**
     * Create and prepare the embed dialog template.
     *
     * @return {Element}
     */
    getDialogTemplate: function() {
        var template = $('<div>').html(this.raptor.getTemplate('embed.dialog', this.options));

        template.find('textarea').change(function(event) {
            template.find('.' + this.options.baseClass + '-preview').html($(event.target).val());
        }.bind(this));

        // Create fake jQuery UI tabs (to prevent hash changes)
        var tabs = template.find('.' + this.options.baseClass + '-panel-tabs');
        tabs.find('li')
            .click(function() {
                tabs.find('ul li').removeClass('ui-state-active').removeClass('ui-tabs-selected');
                $(this).addClass('ui-state-active').addClass('ui-tabs-selected');
                tabs.children('div').hide().eq($(this).index()).show();
            });
        return template;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/embed/embed.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-left.js
/**
 * @fileOverview Contains the float left button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of a filtered preview button to float an image left.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new FilteredPreviewButton({
    name: 'floatLeft',
    applyToElement: function(element) {
        element.removeClass(this.options.cssPrefix + 'float-right');
        element.toggleClass(this.options.cssPrefix + 'float-left');
        cleanEmptyAttributes(element, ['class']);
    },
    getElement: function(range) {
        var images = $(range.commonAncestorContainer).find('img');
        return images.length ? images : null;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-left.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-none.js
/**
 * @fileOverview Contains the float none button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of a filtered preview button to remove the float an image.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new FilteredPreviewButton({
    name: 'floatNone',
    applyToElement: function(element) {
        element.removeClass(this.options.cssPrefix + 'float-right');
        element.removeClass(this.options.cssPrefix + 'float-left');
        cleanEmptyAttributes(element, ['class']);
    },
    getElement: function(range) {
        var images = $(range.commonAncestorContainer).find('img');
        return images.length ? images : null;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-none.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-right.js
/**
 * @fileOverview Contains the float right button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of a filtered preview button to float an image right.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new FilteredPreviewButton({
    name: 'floatRight',
    applyToElement: function(element) {
        element.removeClass(this.options.cssPrefix + 'float-left');
        element.toggleClass(this.options.cssPrefix + 'float-right');
        cleanEmptyAttributes(element, ['class']);
    },
    getElement: function(range) {
        var images = $(range.commonAncestorContainer).find('img');
        return images.length ? images : null;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/float/float-right.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/font-family/font-family.js
/**
 * @fileOverview Contains the basic font-family class code.
 * 
 * @author Nikolay Rodionov <rodi.incave@gmail.com>
 * @author David Neilsen <david@panmedia.co.nz>
 */

/**
 * The basic font-family class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options
 */
function FontFamilyMenu(options) {
    this.options= {
        fonts: [
            'arial',
            'palatino',
            'georgia',
            'times',
            'comic-sans',
            'impact',
            'courier'
        ]
    };
    
    SelectMenu.call(this, {
        name: 'fontFamilyMenu'
    });
}

FontFamilyMenu.prototype = Object.create(SelectMenu.prototype);

/**
 * Initialize the basic font menu.
 *
 * @returns {Element}
 */
FontFamilyMenu.prototype.init = function() {
    this.raptor.bind('selectionChange', this.updateButton.bind(this));
    this.updateButton();
    return SelectMenu.prototype.init.apply(this, arguments);
};

/**
 * Updates the basic font menu with the current font.
 */
FontFamilyMenu.prototype.updateButton = function() {
    var tag = selectionGetElements()[0],
        button = this.getButton().getButton(),
        font = null,
        closest = null;

    aButtonSetLabel(button, tr('fontFamilyMenuFontDefault'));
    aButtonSetIcon(button, false);
    if (!tag) {
        return;
    }
    
    for (var fontsIndex = 0; fontsIndex < this.options.fonts.length; fontsIndex++) {
        closest = $(tag).closest('.' + this.options.cssPrefix + 'font-' + this.options.fonts[fontsIndex]);
        if (closest.length) {
            font = this.options.fonts[fontsIndex];
            break;
        }
    }
    
    if (font) {
        aButtonSetLabel(button, this.getMenu().find('[data-font="' + font + '"]').text());
        return;
    }
};

/**
 * Changes the font-family of the selection.
 *
 * @param {type} font The current font.
 */
FontFamilyMenu.prototype.changeFont = function(font) {
    selectionExpandToWord();
    if (font === 'default') {
        selectionGetElements().parents('.' + this.options.cssPrefix + 'font').addBack().each(function() {
            var classes = $(this).attr('class');
            if (classes === null || typeof classes === 'undefined') {
                return;
            }
            classes = classes.match(/(cms-font-(.*?))( |$)/ig);
            if (classes === null || typeof classes === 'undefined') {
                return;
            }
            for (var i = 0, l = classes.length; i < l; i++) {
                $(this).removeClass($.trim(classes[i]));
            }
        });
    } else {
        var uniqueId = elementUniqueId();
        selectionToggleWrapper('span', {
            classes: this.options.classes || this.options.cssPrefix + 'font ' + this.options.cssPrefix + 'font-' + font,
            attributes: {
                id: uniqueId
            }
        });
        var element = $('#' + uniqueId);
        if (element.length) {
            selectionSelectInner(element.removeAttr('id').get(0));
            var splitNode;
            do {
                splitNode = $('#' + uniqueId);
                splitNode.removeAttr('id');
            } while (splitNode.length);
        }
    }
};

/**
 * The preview state for the basic font menu.
 *
 * @param event The mouse event which triggered the preview.
 */
FontFamilyMenu.prototype.menuItemMouseEnter = function(event) {
    this.raptor.actionPreview(function() {
        this.changeFont($(event.currentTarget).data('font'));
    }.bind(this));
};

/**
 * Restores the selection from the preview.
 *
 * @param event
 */
FontFamilyMenu.prototype.menuItemMouseLeave = function(event) {
    this.raptor.actionPreviewRestore();
};

/**
 * Applies the font change to the selection.
 *
 * @param event The mouse event to trigger the application of the font.
 */
FontFamilyMenu.prototype.menuItemClick = function(event) {
    SelectMenu.prototype.menuItemClick.apply(this, arguments);
    this.raptor.actionApply(function() {
        this.changeFont($(event.currentTarget).data('font'));
    }.bind(this));
};

/**
 * Prepare and return the menu items to be used in the Raptor UI.
 * @returns {Element} The menu items.
 */
FontFamilyMenu.prototype.getMenuItems = function() {
    var items = this.raptor.getTemplate('font-family.menu-item', {
        fontName: 'default',
        fontTitle: tr('fontFamilyMenuFontDefault')
    });
    for (var i = 0, l = this.options.fonts.length; i < l; i++) {
        items += this.raptor.getTemplate('font-family.menu-item', {
            fontName: this.options.fonts[i],
            fontTitle: tr(('fontFamilyMenuFont-' + this.options.fonts[i]).replace(/-([a-z])/g, function (matches) {
                return matches[1].toUpperCase()
            }))
        });
    }
    return items;
};

Raptor.registerUi(new FontFamilyMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/font-family/font-family.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/guides/guides.js
/**
 * @fileOverview Contains the guides button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of a preview button to show the guides of the elements.
 *
 * @todo des and type for the param.
 * @param {type} param
 */
Raptor.registerUi(new PreviewButton({
    name: 'guides',

    action: function() {
        this.raptor.getElement().toggleClass(this.getClassName());
        this.updateButtonState();
    },

    updateButtonState: function() {
        if (this.raptor.getElement().hasClass(this.getClassName())) {
            aButtonActive(this.button);
        } else {
            aButtonInactive(this.button);
        }
    },

    init: function() {
        this.raptor.bind('cancel', this.removeClass.bind(this));
        this.raptor.bind('saved', this.removeClass.bind(this));
        return PreviewButton.prototype.init.call(this);
    },

    removeClass: function() {
        this.raptor.getElement().removeClass(this.getClassName());
    },

    getClassName: function() {
        return this.options.baseClass + '-visible';
    },

    mouseEnter: function() {
        PreviewButton.prototype.mouseEnter.call(this);
        this.updateButtonState();
    },

    mouseLeave: function() {
        PreviewButton.prototype.mouseLeave.call(this);
        this.updateButtonState();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/guides/guides.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/history/history-redo.js
/**
 * @fileOverview Contains the history redo code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the button class to redo an action.
 *
 * @todo param details?
 * @param {type} param
 */
Raptor.registerUi(new Button({
    name: 'historyRedo',
    hotkey: ['ctrl+y', 'ctrl+shift+z'],

    action: function() {
        this.raptor.historyForward();
    },

    init: function () {
        this.raptor.bind('historyChange', this.historyChange.bind(this));
        Button.prototype.init.apply(this, arguments);
        aButtonDisable(this.button);
        return this.button;
    },

    historyChange: function() {
        if (this.raptor.present < this.raptor.history.length - 1) {
            aButtonEnable(this.button);
        } else {
            aButtonDisable(this.button);
        }
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/history/history-redo.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/history/history-undo.js
/**
 * @fileOverview Contains the history undo code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the button class to undo an action.
 *
 * @todo param details?
 * @param {type} param
 */
Raptor.registerUi(new Button({
    name: 'historyUndo',
    hotkey: 'ctrl+z',

    action: function() {
        this.raptor.historyBack();
    },

    init: function () {
        this.raptor.bind('historyChange', this.historyChange.bind(this));
        Button.prototype.init.apply(this, arguments);
        aButtonDisable(this.button);
        return this.button;
    },

    historyChange: function() {
        if (this.raptor.present === 0) {
            aButtonDisable(this.button);
        } else {
            aButtonEnable(this.button);
        }
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/history/history-undo.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/hr/hr-create.js
/**
 * @fileOverview Contains the hr button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the preview button to insert a hr at the selection.
 *
 * @todo param details?
 * @param {type} param
 */
Raptor.registerUi(new PreviewButton({
    name: 'hrCreate',
    action: function() {
        selectionReplace('<hr/>');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/hr/hr-create.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/image-resize/image-resize.js
/**
 * @fileOverview Contains the image resize button code.
 * @author David Neilsen <david@panmedia.co.nz>
 */
Raptor.registerUi(new DialogButton({
    name: 'imageResize',
    proportional: true,
    image: null,
    dialogOptions: {
        width: 450
    },

    action: function() {
        var dialog = this.getDialog();
        this.image = nodeUniqueId(this.layout.target);
        this.originalWidth = this.layout.target.width;
        this.originalHeight = this.layout.target.height;
        dialog.find('[name=width]').val(this.layout.target.width),
        dialog.find('[name=height]').val(this.layout.target.height);
        this.openDialog();
    },

    applyAction: function() {
        var dialog = this.getDialog(),
            width = dialog.find('[name=width]').val(),
            height = dialog.find('[name=height]').val();
        this.raptor.actionApply(function() {
            $('#' + this.image)
                .css({
                    width: width,
                    height: height
                })
                .attr('width', width)
                .attr('height', height);
            selectionSelectOuter($('#' + this.image)[0]);
        }.bind(this));
    },

    getDialogTemplate: function() {
        var template = $('<div>').html(this.raptor.getTemplate('image-resize.dialog', this.options)),
            plugin = this;
        template.find('.' + this.options.baseClass + '-lock-proportions')
            .hover(function() {
                $(this).addClass('ui-state-hover');
            }, function() {
                $(this).removeClass('ui-state-hover');
            })
            .click(function() {
                dialogs[plugin.name].instance.proportional = !dialogs[plugin.name].instance.proportional;
                $(this)
                    .find('.ui-icon')
                    .toggleClass('ui-icon-locked', plugin.proportional)
                    .toggleClass('ui-icon-unlocked', !plugin.proportional);
            });

        var widthInput = template.find('[name=width]'),
            heightInput = template.find('[name=height]');

        widthInput.on('input.raptor', function() {
            var value = parseInt($(this).val());
            if (!isNaN(value)) {
                if (dialogs[plugin.name].instance.proportional) {
                    heightInput.val(Math.round(Math.abs(dialogs[plugin.name].instance.originalHeight / dialogs[plugin.name].instance.originalWidth * value)));
                }
            }
        });

        heightInput.on('input.raptor', function() {
            var value = parseInt($(this).val());
            if (!isNaN(value)) {
                if (dialogs[plugin.name].instance.proportional) {
                    widthInput.val(Math.round(Math.abs(dialogs[plugin.name].instance.originalWidth / dialogs[plugin.name].instance.originalHeight * value)));
                }
            }
        });

        return template;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/image-resize/image-resize.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/image-swap/image-swap.js
/**
 * @fileOverview Contains the image swap button code.
 * @author David Neilsen <david@panmedia.co.nz>
 */
Raptor.registerUi(new Button({
    name: 'imageSwap',
    chooser: null,
    click: function() {
        selectionSelectOuter(this.layout.target);
        this.raptor.getPlugin(this.options.chooser).action(this.layout.target);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/image-swap/image-swap.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/insert-file/insert-file.js
/**
 * @fileOverview Contains the insert file button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the button class to allow the insertation of files.
 *
 * @todo param details?
 * @param {type} param
 */
Raptor.registerUi(new DialogButton({
    name: 'insertFile',
    state: false,
    /** @type {string[]} Image extensions*/
    imageTypes: [
        'jpeg',
        'jpg',
        'png',
        'gif'
    ],
    options: {

        /**
         * Save the current state, show the insert file dialog or file manager.
         *
         * @type {null|Function} Specify a function to use instead of the default
         *                       file insertion dialog.
         * @return {Boolean} False to indicate that custom action failed and the
         *                         default dialog should be used.
         */
        customAction: false
    },

    /**
     * Open the insert file dialog or file manager.
     */
    action: function(target) {
        // If a customAction has been specified, use it instead of the default dialog.
        if (!this.options.customAction || this.options.customAction.call(this, target) === false) {
            if (typeof target !== 'undefined') {
                this.getDialog().find('[name=location]').val(target.getAttribute('src') || target.getAttribute('href'));
                this.getDialog().find('[name=name]').val(target.innerHTML);
            } else {
                this.getDialog().find('[name=location]').val('');
                this.getDialog().find('[name=name]').val('');
            }
            return this.openDialog();
        }
    },

    applyAction: function() {
        var dialog = this.getDialog(),
            location = dialog.find('[name=location]').val(),
            name = dialog.find('[name=name]').val();
        this.raptor.actionApply(function() {
            this.insertFiles([{
                location: location,
                name: name
            }]);
        }.bind(this));
    },

    getDialogTemplate: function() {
        return $(this.raptor.getTemplate('insert-file.dialog'));
    },

    /**
     * Attempt to determine the file type from either the file's explicitly set
     * extension property, or the file extension of the file's location property.
     *
     * @param  {Object} file
     * @return {string}
     */
    getFileType: function(file) {
        if (typeof file.extension !== 'undefined') {
            return file.extension.toLowerCase();
        }
        var extension = file.location.split('.');
        if (extension.length > 0) {
            return extension.pop().toLowerCase();
        }
        return 'unknown';
    },

    /**
     * @param  {Object} file
     * @return {Boolean} True if the file is an image.
     */
    isImage: function(file) {
        return $.inArray(this.getFileType(file), this.imageTypes) !== -1;
    },

    /**
     * Insert the given files. If files contains only one item, it is inserted
     * with selectionReplaceWithinValidTags using an appropriate valid tag array
     * for the file's type. If files contains more than one item, the items are
     * processed into an array of HTML strings, joined then inserted using
     * selectionReplaceWithinValidTags with a valid tag array of tags that may
     * contain both image and anchor tags.
     *
     * [
     *     {
     *         location: location of the file, e.g. http://www.raptor-editor.com/images/html5.png
     *         name: a name for the file, e.g. HTML5 Logo
     *         extension: explicitly defined extension for the file, e.g. png
     *     }
     * ]
     *
     * @param  {Object[]} files Array of files to be inserted.
     */
    insertFiles: function(files) {
        this.raptor.resume();
        if (!files.length) {
            return;
        }
        this.raptor.actionApply(function() {
            if (files.length === 1) {
                if ((this.isImage(files[0]) && $(selectionGetHtml()).is('img')) || selectionIsEmpty()) {
                    this.replaceFiles(files);
                } else {
                    this.linkFiles(files);
                }
            } else {
                this.linkFiles(files);
            }
        }.bind(this));
    },

    linkFiles: function(files) {
        selectionExpandTo('a', this.raptor.getElement());
        selectionTrim();
        var applier = rangy.createApplier({
            tag: 'a',
            attributes: {
                href: files[0].location.replace(/([^:])\/\//g, '$1/'),
                title: files[0].name,
                'class': this.options.cssPrefix + 'file ' + this.options.cssPrefix + this.getFileType(files[0])
            }
        });
        applier.applyToSelection();
    },

    replaceFiles: function(files) {
        var elements = [];
        for (var fileIndex = 0; fileIndex < files.length; fileIndex++) {
            elements.push(this.prepareElement(files[fileIndex]));
        }
        selectionReplace(elements.join(', '));
    },

    /**
     * Prepare the HTML for either an image or an anchor tag, depending on the file's type.
     *
     * @param {Object} file
     * @param {string|null} text The text to use as the tag's title and an anchor
     *                           tag's HTML. If null, the file's name is used.
     * @return {string} The tag's HTML.
     */
    prepareElement: function(file, text) {
        if (this.isImage(file)) {
            return this.prepareImage(file, this.options.cssPrefix + this.getFileType(file), text);
        } else {
            return this.prepareAnchor(file, this.options.cssPrefix + 'file ' + this.options.cssPrefix + this.getFileType(file), text);
        }
    },

    /**
     * Prepare HTML for an image tag.
     *
     * @param  {Object} file
     * @param  {string} classNames Classnames to apply to the image tag.
     * @param  {string|null} text Text to use as the image tag's title. If null,
     *                            the file's name is used.
     * @return {string} Image tag's HTML.
     */
    prepareImage: function(file, classNames, text) {
        return $('<div/>').html($('<img/>').attr({
            src: file.location.replace(/([^:])\/\//g, '$1/'),
            title: text || file.name,
            'class': classNames
        })).html();
    },

    /**
     * Prepare HTML for an anchor tag.
     *
     * @param  {Object} file
     * @param  {string} classNames Classnames to apply to the anchor tag.
     * @param  {string|null} text Text to use as the anchor tag's title & content. If null,
     *                            the file's name is used.
     * @return {string} Anchor tag's HTML.
     */
    prepareAnchor: function(file, classNames, text) {
        return $('<div/>').html($('<a/>').attr({
            href: file.location.replace(/([^:])\/\//g, '$1/'),
            title: file.name,
            'class': classNames
        }).html(text || file.name)).html();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/insert-file/insert-file.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/language-menu/language-menu.js
/**
 * @fileOverview Contains the insert file button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The language menu class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options
 */
function LanguageMenu(options) {
    this.options = {
        persist: true
    };
    SelectMenu.call(this, {
        name: 'languageMenu'
    });
}

LanguageMenu.prototype = Object.create(SelectMenu.prototype);

/**
 * Initialize the language menu.
 *
 * @return {Element}
 */
LanguageMenu.prototype.init = function() {
    var result = Menu.prototype.init.call(this);
    aButtonSetLabel(this.button.button, localeNames[currentLocale]);
    aButtonSetIcon(this.button.button, 'ui-icon-flag-' + currentLocale.toLowerCase());
    return result;
};

/**
 * Change the editor's language to the current selection.
 *
 * @param {Event} event
 */
LanguageMenu.prototype.menuItemClick = function(event) {
    var locale = $(event.currentTarget).data('value');
    if (this.options.persist) {
        Raptor.persist('locale', locale);
    }
    setTimeout(function() {
        setLocale(locale);
    }, 1);
};

/**
 * @return {jQuery}
 */
LanguageMenu.prototype.getMenuItems = function() {
    var items = '';
    for (var locale in locales) {
        items += this.raptor.getTemplate('language-menu.item', {
            label: localeNames[locale],
            value: locale,
            icon: locale.toLowerCase()
        });
    }
    return items;
};

Raptor.registerUi(new LanguageMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/language-menu/language-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-create.js
/**
 * Create link plugin.
 *
 * @plugin {DialogToggleButton} linkCreate
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */
var linkMenu,
    linkTypes,
    linkContent,
    linkAttributes;

Raptor.registerUi(new DialogToggleButton({
    name: 'linkCreate',

    options: {
        /**
         * Reset the UI when opening the dialog for a second time.
         * If set to false the previous user input is retained.
         * @option {boolean} resetUi
         */
        resetUi: false
    },

    dialogOptions: {
        width: 850
    },

    applyAction: function() {
        this.raptor.actionApply(function() {
            if (!linkAttributes || linkAttributes.href.trim() === '') {
                return;
            }

            // Update
            var range = window.getSelection().getRangeAt(0);
            if (range.commonAncestorContainer.tagName === 'A') {
                for (var linkAttribute in linkAttributes) {
                    range.commonAncestorContainer.setAttribute(linkAttribute, linkAttributes[linkAttribute]);
                }
                return;
            }

            // Create
            selectionExpandToWord();
            selectionExpandTo('a', this.raptor.getElement());
            selectionTrim();
            var applier = rangy.createApplier({
                tag: 'a',
                attributes: linkAttributes
            });
            applier.applyToSelection();
            cleanEmptyElements(this.raptor.getElement(), ['a']);
        }.bind(this));
    },

    getDialog: function() {
        var dialog = DialogToggleButton.prototype.getDialog.call(this);
        var element = selectionGetElement();
        for (var i = 0, l = linkTypes.length; i < l; i++) {
            if (element.is('a')) {
                var result = linkTypes[i].updateInputs(element, linkContent.children('div:eq(' + i + ')'));
                if (result) {
                    linkMenu.find(':radio:eq(' + i + ')').trigger('click');
                }
            } else if (this.options.resetUi) {
                linkTypes[i].resetInputs(linkContent.children('div:eq(' + i + ')'));
            }
        }
        if (!element.is('a') && this.options.resetUi) {
            linkMenu.find(':radio:eq(0)').trigger('click');
        }
        return dialog;
    },

    validateDialog: function() {
        var i = linkMenu.find(':radio:checked').val();
        linkAttributes = linkTypes[i].getAttributes(linkContent.children('div:eq(' + i + ')'));
        return linkAttributes !== false;
    },

    selectionToggle: function() {
        var element = selectionGetElement();
        if (!element) {
            return false;
        }
        if (element.closest('a').length) {
            return true;
        }
        return false;
    },

    getDialogTemplate: function() {
        var template = $(this.raptor.getTemplate('link.dialog', this.options));

        linkMenu = template.find('[data-menu]');
        linkContent = template.find('[data-content]');
        linkTypes = [
            new LinkTypeInternal(this),
            new LinkTypeExternal(this),
            new LinkTypeDocument(this),
            new LinkTypeEmail(this)
        ];

        for (var i = 0, l = linkTypes.length; i < l; i++) {
            $(this.raptor.getTemplate('link.label', linkTypes[i]))
                .click(function() {
                    linkContent.children('div').hide();
                    linkContent.children('div:eq(' + $(this).index() + ')').show();
                })
                .find(':radio')
                    .val(i)
                .end()
                .appendTo(linkMenu);
            $('<div>')
                .append(linkTypes[i].getContent())
                .hide()
                .appendTo(linkContent);
        }
        linkMenu.find(':radio:first').prop('checked', true);
        linkContent.children('div:first').show();

        return template;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-create.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-open.js
/**
 * @fileOverview Contains the link open class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 */

/**
 * The link open plugin class.
 *
 * @constructor
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides Options hash.
 */
function LinkOpen(name, overrides) {
    RaptorPlugin.call(this, name || 'linkOpen', overrides);
}

LinkOpen.prototype = Object.create(RaptorPlugin.prototype);

LinkOpen.prototype.enable = function() {
    this.raptor.getElement().on('click.raptor', 'a', this.openLink);
};

LinkOpen.prototype.openLink = function(event) {
    if (event.ctrlKey && this.href) {
        window.open(this.href, '_blank');
    }
};

Raptor.registerPlugin(new LinkOpen());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-open.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-remove.js
/**
 * Link remove plugin.
 *
 * @plugin PreviewToggleButton linkRemove
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */
Raptor.registerUi(new PreviewToggleButton({
    name: 'linkRemove',
    disable: true,

    action: function() {
        this.raptor.actionApply(function() {
            document.execCommand('unlink');
        }.bind(this));
    },

    selectionToggle: function() {
        var element = selectionGetElement();
        if (!element) {
            return false;
        }
        if (element.closest('a').length) {
            return true;
        }
        return false;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-remove.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-document.js
/**
 * @fileOverview Contains the document link class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The internal link class.
 *
 * @constructor
 * @param {Raptor} raptor
 */
function LinkTypeDocument(linkCreate) {
    this.linkCreate = linkCreate;
    this.label = tr('linkTypeDocumentLabel');
}

LinkTypeDocument.prototype = Object.create(LinkTypeExternal.prototype);

LinkTypeDocument.prototype.resetInputs = function(panel) {
    panel.find('[name=location]').val('http://');
    panel.find('[name=blank]').prop('checked', false);
};

/**
 * @return {String} The document link panel content.
 */
LinkTypeDocument.prototype.getContent = function() {
    return this.linkCreate.raptor.getTemplate('link.document', this.linkCreate.raptor.options);
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-document.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-email.js
/**
 * @fileOverview Contains the internal link class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class Email link class.
 * @constructor
 *
 * @todo param details and des for return.
 * @param {type} raptor
 * @returns {LinkTypeEmail}
 */
function LinkTypeEmail(linkCreate) {
    this.linkCreate = linkCreate;
    this.label = tr('linkTypeEmailLabel');
}

/**
 * Gets the content of the email link.
 *
 * @returns {Element}
 */
LinkTypeEmail.prototype.getContent = function() {
    return this.linkCreate.raptor.getTemplate('link.email', this.linkCreate.raptor.options);
};

/**
 * Gets the attributes of the email link.
 *
 * @param {Element} panel
 * @returns {LinkTypeEmail.prototype.getAttributes.Anonym$0|Boolean}
 */
LinkTypeEmail.prototype.getAttributes = function(panel) {
    var address = panel.find('[name=email]').val(),
        subject = panel.find('[name=subject]').val();
    if ($.trim(subject)) {
        subject = '?Subject=' + encodeURIComponent(subject);
    }
    if ($.trim(address) === '') {
        return false;
    }
    return {
        href: 'mailto:' + address + subject
    };
};

LinkTypeEmail.prototype.resetInputs = function(panel) {
    panel.find('[name=email]').val('');
    panel.find('[name=subject]').val('');
};

/**
 * Updates the users inputs.
 *
 * @param {String} link The email link.
 * @param {Element} panel
 * @returns {Boolean}
 */
LinkTypeEmail.prototype.updateInputs = function(link, panel) {
    var result = false;
        email = '',
        subject = '',
        href = link.attr('href');
    if (href.indexOf('mailto:') === 0) {
        var subjectPosition = href.indexOf('?Subject=');
        if (subjectPosition > 0) {
            email = href.substring(7, subjectPosition);
            subject = href.substring(subjectPosition + 9);
        } else {
            email = href.substring(7);
            subject = '';
        }
        result = true;
    }
    panel.find('[name=email]').val(email);
    panel.find('[name=subject]').val(subject);
    return result;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-email.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-external.js
/**
 * @fileOverview Contains the external link class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The external link class.
 * @constructor
 *
 * @todo check please
 * @param {Object} raptor
 * @returns {Element}
 */
function LinkTypeExternal(linkCreate) {
    this.linkCreate = linkCreate;
    this.label = tr('linkTypeExternalLabel');
}

/**
 * Gets the content of the external link.
 *
 * @returns {Element}
 */
LinkTypeExternal.prototype.getContent = function() {
    return this.linkCreate.raptor.getTemplate('link.external', this.linkCreate.raptor.options);
};

/**
 * Gets the attributes of the external link.
 *
 * @param {Element} panel
 * @returns {LinkTypeExternal.prototype.getAttributes.result|Boolean}
 */
LinkTypeExternal.prototype.getAttributes = function(panel) {
    var address = panel.find('[name=location]').val(),
        target = panel.find('[name=blank]').is(':checked'),
        result = {
            href: address
        };

    if (target) {
        result.target = '_blank';
    }

    if ($.trim(result.href) === 'http://') {
        return false;
    }

    return result;
};

LinkTypeExternal.prototype.resetInputs = function(panel) {
    panel.find('[name=location]').val('http://');
    panel.find('[name=blank]').prop('checked', true);
};

/**
 * Updates the users inputs.
 *
 * @param {String} link The external link.
 * @param {Element} panel
 * @returns {Boolean}
 */
LinkTypeExternal.prototype.updateInputs = function(link, panel) {
    var result = false,
        href = link.attr('href');
    if (href.indexOf('http://') === 0) {
        panel.find('[name=location]').val(href);
        result = true;
    } else {
        panel.find('[name=location]').val('http://');
    }
    if (link.attr('target') === '_blank') {
        panel.find('[name=blank]').prop('checked', true);
    } else {
        panel.find('[name=blank]').prop('checked', false);
    }
    return result;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-external.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-internal.js
/**
 * @fileOverview Contains the internal link class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @class The internal link class.
 * @constructor
 *
 * @todo check please
 * @param {Object} raptor
 * @returns {Element}
 */
function LinkTypeInternal(linkCreate) {
    this.linkCreate = linkCreate;
    this.label = tr('linkTypeInternalLabel');
}

/**
 * Gets the content of the internal link.
 *
 * @returns {Element}
 */
LinkTypeInternal.prototype.getContent = function() {
    return this.linkCreate.raptor.getTemplate('link.internal', {
        baseClass: this.linkCreate.raptor.options.baseClass,
        domain: window.location.protocol + '//' + window.location.host
    });
};

/**
 * Gets the attributes of the internal link.
 *
 * @todo type and des for panel and return
 * @param {Element} panel
 * @returns {LinkTypeInternal.prototype.getAttributes.result}
 */
LinkTypeInternal.prototype.getAttributes = function(panel) {
    var address = panel.find('[name=location]').val(),
        target = panel.find('[name=blank]').is(':checked'),
        result = {
            href: address
        };

    if (target) {
        result.target = '_blank';
    }

    return result;
};

LinkTypeInternal.prototype.resetInputs = function(panel) {
    panel.find('[name=location]').val('');
    panel.find('[name=blank]').prop('checked', false);
};

/**
 * Updates the users inputs.
 *
 * @todo type and des for panel and des for return.
 * @param {String} link The internal lnk.
 * @param {Element} panel
 * @returns {Boolean}
 */
LinkTypeInternal.prototype.updateInputs = function(link, panel) {
    var href = link.attr('href');
    if (href.indexOf('http://') === -1 &&
            href.indexOf('mailto:') === -1) {
        panel.find('[name=location]').val(href);
    } else {
        panel.find('[name=location]').val('');
    }
    if (link.attr('target') === '_blank') {
        panel.find('[name=blank]').prop('checked', true);
    } else {
        panel.find('[name=blank]').prop('checked', false);
    }
    return false;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/link/link-type-internal.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/list/list-ordered.js
/**
 * @fileOverview Contains the ordered list button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a new instance of the preview toggle button to create ordered lists.
 */
Raptor.registerUi(new Button({
    name: 'listOrdered',
    action: function() {
        document.execCommand('insertOrderedList');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/list/list-ordered.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/list/list-unordered.js
/**
 * @fileOverview Contains the unordered list button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a new instance of the preview toggle button to create unordered lists.
 *
 * @todo param details?
 * @param {type} param
 */
Raptor.registerUi(new Button({
    name: 'listUnordered',
    action: function() {
        document.execCommand('insertUnorderedList');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/list/list-unordered.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/logo/logo.js
/**
 * @fileOverview Contains the logo button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a new instance of the button class to display the raptor logo and
 * link to the raptor version page.
 */
Raptor.registerUi(new Button({
    name: 'logo',
    // <usage-statistics>
    init: function() {
        var button = Button.prototype.init.apply(this, arguments);
        button.find('.ui-button-icon-primary').css({
            'background-image': 'url(//www.raptor-editor.com/logo/VERSION?json=' +
                encodeURIComponent(JSON.stringify(this.raptor.options)) + ')'
        });
        return button;
    },
    // </usage-statistics>
    action: function() {
        window.open('http://www.raptor-editor.com/about/VERSION', '_blank');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/logo/logo.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/no-break/no-break.js
/**
 * @fileOverview No break plugin.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 */

function NoBreakPlugin(name, overrides) {
    RaptorPlugin.call(this, name || 'noBreak', overrides);
}

NoBreakPlugin.prototype = Object.create(RaptorPlugin.prototype);

NoBreakPlugin.prototype.init = function() {
    this.raptor.getElement().on('keypress.raptor', this.preventReturn.bind(this));
    this.raptor.getElement().on('drop.raptor', this.preventDrop.bind(this));
};

NoBreakPlugin.prototype.preventReturn = function(event) {
    if (this.options.enabled && event.which === 13) {
        return false;
    }
};

NoBreakPlugin.prototype.preventDrop = function(event) {
    return this.options.enabled;
// Attempt to allow dropping of plain text (not working)
//
//    console.log(event.originalEvent);
//    var range = rangy.getSelection().getRangeAt(0).cloneRange();
//    console.log(range);
//    console.log(range.startOffset);
//    console.log(range.endOffset);
//    for (var i = 0, l = event.originalEvent.dataTransfer.items.length; i < l; i++) {
//        console.log(event.originalEvent);
//        if (event.originalEvent.dataTransfer.items[i].type == 'text/plain' &&
//                event.originalEvent.dataTransfer.items[i].kind == 'string') {
//            event.originalEvent.dataTransfer.items[i].getAsString(function(content) {
//                this.raptor.actionApply(function() {
//                    rangeReplace(range, content);
////                    selectionReplace(content);
//                })
//            }.bind(this));
//        }
//    }
//    return false;
};

Raptor.registerPlugin(new NoBreakPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/no-break/no-break.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/normalise-line-breaks/normalise-line-breaks.js
/**
 * @fileOverview Contains the view normalise line breaks button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Attempts to enforce standard behaviour across browsers for return &
 * shift+return key presses.
 *
 * @constructor
 * @param {String} name
 * @param {Object} overrides
 */
function NormaliseLineBreaksPlugin(name, overrides) {
    RaptorPlugin.call(this, name || 'normaliseLineBreaks', overrides);
}

NormaliseLineBreaksPlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Register hotkey actions.
 */
NormaliseLineBreaksPlugin.prototype.init = function() {
    this.raptor.registerHotkey('return', this.returnPressed.bind(this));
    this.raptor.registerHotkey('shift+return', this.shiftReturnPressed.bind(this));
};

NormaliseLineBreaksPlugin.prototype.returnPressedList = function(selectedElement) {
    var selectedListElement = selectedElement.closest('li');
    if (!selectedListElement.length) {
        return false;
    }

    var parentList = selectedListElement.closest('ul, ol');
    var listType = parentList.get(0).tagName.toLowerCase(),
        replacementElement = false;

    // If current list element is empty, list element needs to be replaced with <p>
    if (elementIsEmpty(selectedListElement)) {
        // If not at bottom of list, list must be broken
        var nextListElement = selectedListElement.next();
        if (nextListElement.length && nextListElement.is('li')) {
            replacementElement = listBreakByReplacingSelection(listType, 'li', this.raptor.getElement(), '<p>&nbsp;</p>');
            if (replacementElement) {
                selectionSelectInner(replacementElement.get(0));
            }
        } else {
            selectedListElement.remove();
            selectionSelectInner($('<p>&nbsp;</p>').insertAfter(parentList).get(0));
        }
    } else {
        replacementElement = listBreakAtSelection(listType, 'li', this.raptor.getElement());
        if (replacementElement) {
            selectionSelectStart(replacementElement.get(0));
        }
    }
    return true;

};

/**
 * Handle return keypress.
 *
 * When inside a ul/ol, the the current list item is split and the cursor is
 * placed at the start of the second list item.
 *
 * @return {Boolean} True if the keypress has been handled and should not propagate
 *                        further
 */
NormaliseLineBreaksPlugin.prototype.returnPressed = function() {
    var selectedElement = selectionGetElement();

    if (this.returnPressedList(selectedElement)) {
        return true;
    }
    return false;
};

NormaliseLineBreaksPlugin.prototype.shiftReturnPressedList = function(selectedElement) {
    if (selectedElement.closest('li').length) {
        var listType = selectedElement.closest('ul, ol').get(0).tagName.toLowerCase();
        var replacementElement = listBreakByReplacingSelection(listType, 'li', this.raptor.getElement(), '<p>&nbsp;</p>');
        if (replacementElement) {
            selectionSelectInner(replacementElement.get(0));
        }
        return true;
    }

    return false;
};

/**
 * Handle shift+return keypress.
 *
 * When inside a ul/ol, the the current selection is replaced with a p by splitting the list.
 *
 * @return {Boolean} True if the keypress has been handled and should not propagate
 *                        further
 */
NormaliseLineBreaksPlugin.prototype.shiftReturnPressed = function() {
    var selectedElement = selectionGetElement();
    if (this.shiftReturnPressedList(selectedElement)) {
        return true;
    }
    return false;
};

Raptor.registerPlugin(new NormaliseLineBreaksPlugin());

;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/normalise-line-breaks/normalise-line-breaks.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/paste/paste.js
/**
 * @fileOverview Contains the paste plugin class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

var pasteInProgress = false,
    pasteDialog = null,
    pasteInstance = null,
    pasteShiftDown = null;

/**
 * The paste plugin class.
 *
 * @constructor
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides Options hash.
 */
function PastePlugin(name, overrides) {
    /**
     * Default options.
     *
     * @type {Object}
     */
    this.options = {
        /**
         * Tags that will not be stripped from pasted content.
         * @type {Array}
         */
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote',
            'p', 'a', 'span', 'hr', 'br', 'strong', 'em',
            'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot'
        ],

        allowedAttributes: [
            'href', 'title', 'colspan', 'rowspan'
        ],

        allowedEmptyTags: [
            'hr', 'br', 'td', 'th'
        ],

        panels: [
            'formatted-clean',
            'plain-text',
            'formatted-unclean',
            'source'
        ]
    };

    RaptorPlugin.call(this, name || 'paste', overrides);
}

PastePlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Enables pasting.
 */
PastePlugin.prototype.enable = function() {
    this.raptor.getElement().on('paste.raptor', this.capturePaste.bind(this));
};

PastePlugin.prototype.capturePaste = function(event) {
    if (pasteShiftDown) {
        return;
    }
    if (pasteInProgress) {
        return false;
    }

    selectionSave();

    var element = this.raptor.getNode();
    var savedContent = element.innerHTML;
    if (element && element.clipboardData && event.clipboardData.getData) {
        // Webkit - get data from clipboard, put into editable, cleanup, then cancel event
        if (/text\/html/.test(event.clipboardData.types)) {
            element.innerHTML = event.clipboardData.getData('text/html');
        } else if (/text\/plain/.test(event.clipboardData.types)) {
            element.innerHTML = event.clipboardData.getData('text/plain');
        } else {
            element.innerHTML = '';
        }
        this.waitForPasteData(element, savedContent);
        event.stopPropagation();
        event.preventDefault();
        return false;
    } else {
        // Everything else - empty editable and allow browser to paste content into it, then cleanup
        element.innerHTML = '';
        this.waitForPasteData(element, savedContent);
        return true;
    }
};

PastePlugin.prototype.waitForPasteData = function(element, savedContent) {
    if (element.innerHTML !== '') {
        this.processPaste(element, savedContent);
    } else {
        setTimeout(function() {
            this.waitForPasteData(element, savedContent)
        }.bind(this), 20);
    }
};

PastePlugin.prototype.processPaste = function(element, savedContent) {
    var pastedData = element.innerHTML;
    element.innerHTML = savedContent;
    this.showPasteDialog(pastedData);
};

/**
 * Opens the paste dialog.
 */
PastePlugin.prototype.showPasteDialog = function(pastedData) {
    aDialogOpen(this.getDialog(this, pastedData));
};

/**
 * Inserts the pasted content into the selection.
 *
 * @param {HTML} html The html to be pasted into the selection.
 */
PastePlugin.prototype.pasteContent = function(html) {
    this.raptor.actionApply(function() {
        // @todo fire an event to allow plugins to clean up, i.e. table plugin adding a cms-table class
        var uniqueId = elementUniqueId();
        selectionRestore();
        html = this.filterAttributes(html);
        html = this.filterChars(html);
        var newNodes = selectionReplace(html);
        if (newNodes.length > 0) {
            range = rangy.createRange();
            range.setStartBefore(newNodes[0]);
            range.setEndAfter(newNodes[newNodes.length - 1]);
            selectionSet(range);
        }
        this.raptor.fire('insert-nodes', [newNodes]);
    }.bind(this));
};

/**
 * Gets the paste dialog.
 *
 * @todo type for instance
 * @param {type} instance The paste instance
 * @returns {Object} The paste dialog.
 */
PastePlugin.prototype.getDialog = function(instance, pastedData) {
    pasteInstance = instance;
    if (!pasteDialog) {
        pasteDialog = $('<div>').html(this.raptor.getTemplate('paste.dialog', this.options));
        for (var i = 0, l = this.options.panels.length; i < l; i++) {
            pasteDialog.find('.' + this.options.baseClass + '-tab-' + this.options.panels[i]).css('display', '');
            if (i === 0) {
                pasteDialog.find('.' + this.options.baseClass + '-content-' + this.options.panels[i]).css('display', '');
            }
        }
        pasteDialog.find('.' + this.options.baseClass + '-panel-tabs > div:visible:not(:first)').hide();
        aDialog(pasteDialog, {
            modal: true,
            resizable: true,
            autoOpen: false,
            width: 800,
            height: 500,
            minWidth: 700,
            minHeight: 400,
            title: tr('pasteDialogTitle'),
            dialogClass: this.options.baseClass + '-dialog',
            close: function() {
                pasteInProgress = false;
            },
            buttons: [
                {
                    text: tr('pasteDialogOKButton'),
                    click: function() {
                        var element = pasteDialog.find('.' + this.options.baseClass + '-area:visible');
                        aDialogClose(pasteDialog);
                        pasteInstance.pasteContent(element.html());
                    }.bind(this),
                    icons: {
                        primary: 'ui-icon-circle-check'
                    }
                },
                {
                    text: tr('pasteDialogCancelButton'),
                    click: function() {
                        selectionDestroy();
                        aDialogClose(pasteDialog);
                    },
                    icons: {
                        primary: 'ui-icon-circle-close'
                    }
                }
            ]
        });

        // Create fake jQuery UI tabs (to prevent hash changes)
        var tabs = pasteDialog.find('.' + this.options.baseClass + '-panel-tabs');
        tabs.find('li')
            .click(function() {
                tabs.find('ul li').removeClass('ui-state-active').removeClass('ui-tabs-selected');
                $(this).addClass('ui-state-active').addClass('ui-tabs-selected');
                tabs.children('div').hide().eq($(this).index()).show();
            });
    }
    this.updateAreas(pastedData);
    return pasteDialog;
};

/**
 * Attempts to filter rubbish from content using regular expressions.
 *
 * @param  {String} content Dirty text
 * @return {String} The filtered content
 */
PastePlugin.prototype.filterAttributes = function(content) {
    // The filters variable is an array of of regular expression & handler pairs.
    //
    // The regular expressions attempt to strip out a lot of style data that
    // MS Word likes to insert when pasting into a contentEditable.
    // Almost all of it is junk and not good html.
    //
    // The hander is a place to put a function for match handling.
    // In most cases, it just handles it as empty string.  But the option is there
    // for more complex handling.
    var filters = [
        // Meta tags, link tags, and prefixed tags
        {regexp: /(<meta\s*[^>]*\s*>)|(<\s*link\s* href="file:[^>]*\s*>)|(<\/?\s*\w+:[^>]*\s*>)/gi, handler: ''},
        // MS class tags and comment tags.
        {regexp: /(class="Mso[^"]*")|(<!--(.|\s){1,}?-->)/gi, handler: ''},
        // Apple class tags
        {regexp: /(class="Apple-(style|converted)-[a-z]+\s?[^"]+")/, handle: ''},
        // Google doc attributes
        {regexp: /id="internal-source-marker_[^"]+"|dir="[rtl]{3}"/, handle: ''},
        // blank p tags
        {regexp: /(<p[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/p[^>]*>)|(<p[^>]*>\s*<font[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/\s*font\s*>\s<\/p[^>]*>)/ig, handler: ''},
        // Strip out styles containing mso defs and margins, as likely added in IE and are not good to have as it mangles presentation.
        {regexp: /(style="[^"]*mso-[^;][^"]*")|(style="margin:\s*[^;"]*;")/gi, handler: ''},
        // Style tags
        {regexp: /(?:<style([^>]*)>([\s\S]*?)<\/style>|<link\s+(?=[^>]*rel=['"]?stylesheet)([^>]*?href=(['"])([^>]*?)\4[^>\/]*)\/?>)/gi, handler: ''},
        // Scripts (if any)
        {regexp: /(<\s*script[^>]*>((.|\s)*?)<\\?\/\s*script\s*>)|(<\s*script\b([^<>]|\s)*>?)|(<[^>]*=(\s|)*[("|')]javascript:[^$1][(\s|.)]*[$1][^>]*>)/ig, handler: ''}
    ];

    $.each(filters, function(i, filter) {
        content = content.replace(filter.regexp, filter.handler);
    });

    return content;
};

/**
 * Replaces commonly-used Windows 1252 encoded chars that do not exist in ASCII or ISO-8859-1 with ISO-8859-1 cognates.
 * @param  {[type]} content [description]
 * @return {[type]}
 */
PastePlugin.prototype.filterChars = function(content) {
    var s = content;

    // smart single quotes and apostrophe
    s = s.replace(/[\u2018|\u2019|\u201A]/g, '\'');

    // smart double quotes
    s = s.replace(/[\u201C|\u201D|\u201E]/g, '\"');

    // ellipsis
    s = s.replace(/\u2026/g, '...');

    // dashes
    s = s.replace(/[\u2013|\u2014]/g, '-');

    // circumflex
    s = s.replace(/\u02C6/g, '^');

    // open angle bracket
    s = s.replace(/\u2039/g, '<');

    // close angle bracket
    s = s.replace(/\u203A/g, '>');

    // spaces
    s = s.replace(/[\u02DC|\u00A0]/g, ' ');

    return s;
};

/**
 * Strip all attributes from content (if it's an element), and every element contained within
 * Strip loop taken from <a href="http://stackoverflow.com/a/1870487/187954">Remove all attributes</a>
 * @param  {String|Element} content The string / element to be cleaned
 * @return {String} The cleaned string
 */
PastePlugin.prototype.stripAttributes = function(content) {
    content = $('<div/>').html(content);
    var allowedAttributes = this.options.allowedAttributes;

    $(content.find('*')).each(function() {
        // First copy the attributes to remove if we don't do this it causes problems iterating over the array
        // we're removing elements from
        var attributes = [];
        $.each(this.attributes, function(index, attribute) {
            // Do not remove allowed attributes
            if (-1 !== $.inArray(attribute.nodeName, allowedAttributes)) {
                return;
            }
            attributes.push(attribute.nodeName);
        });

        // now remove the attributes
        for (var attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++) {
            $(this).attr(attributes[attributeIndex], null);
        }
    });
    return content.html();
};

/**
 * Remove empty tags.
 *
 * @param {String} content The HTML containing empty elements to be removed
 * @return {String} The cleaned HTML
 */
PastePlugin.prototype.stripEmpty = function(content) {
    var wrapper = $('<div/>').html(content);
    var allowedEmptyTags = this.options.allowedEmptyTags;
    wrapper.find('*').filter(function() {
        // Do not strip elements in allowedEmptyTags
        if (-1 !== $.inArray(this.tagName.toLowerCase(), allowedEmptyTags)) {
            return false;
        }
        // If the element has at least one child element that exists in allowedEmptyTags, do not strip it
        if ($(this).find(allowedEmptyTags.join(',')).length) {
            return false;
        }
        return $.trim($(this).text()) === '';
    }).remove();
    return wrapper.html();
};

/**
 * Remove spans that have no attributes.
 *
 * @param {String} content
 * @return {String} The cleaned HTML
 */
PastePlugin.prototype.stripSpans = function(content) {
    var wrapper = $('<div/>').html(content);
    wrapper.find('span').each(function() {
        if (!this.attributes.length) {
            $(this).replaceWith($(this).html());
        }
    });
    return wrapper.html();
};

/**
 * Update text input content.
 */
PastePlugin.prototype.updateAreas = function(pastedData) {
    var markup = pastedData;
    markup = this.filterAttributes(markup);
    markup = this.filterChars(markup);
    markup = this.stripEmpty(markup);
    markup = this.stripAttributes(markup);
    markup = this.stripSpans(markup);
    markup = stringStripTags(markup, this.options.allowedTags);

    var plain = $('<div/>').html(pastedData).text();
    var html = pastedData;

    pasteDialog.find('.' + this.options.baseClass + '-markup').html(markup);
    pasteDialog.find('.' + this.options.baseClass + '-plain').html(plain.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br/>$2'));
    pasteDialog.find('.' + this.options.baseClass + '-rich').html(markup);
    pasteDialog.find('.' + this.options.baseClass + '-source').text(html);
};

$(document).on('keyup.raptor keydown.raptor', function(event) {
    pasteShiftDown = event.shiftKey;
});

Raptor.registerPlugin(new PastePlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/paste/paste.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/placeholder/placeholder.js
/**
 * @fileOverview Placeholder text component.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Placeholder plugin
 *
 * @constructor
 * @augments RaptorPlugin
 * @param {[type]} name
 * @param {[type]} overrides
 */
function PlaceholderPlugin(name, overrides) {

    /**
     * Default placholder plugin options.
     *
     * @type {Object}
     */
    this.options = {

        /**
         * The placeholder content used if the Raptor Editor's instance has no content.
         *
         * @type {String}
         */
        content: tr('placeholderPluginDefaultContent'),

        /**
         * Tag to wrap placeholder content.
         *
         * @type {String}
         */
        tag: 'p',

        /**
         * Select placeholder content when inserted.
         *
         * @type {Boolean}
         */
        select: true
    };

    RaptorPlugin.call(this, name || 'placeholder', overrides);
}

PlaceholderPlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Init placeholder plugin.
 */
PlaceholderPlugin.prototype.init = function() {
    this.raptor.bind('enabled', this.enabled.bind(this));
    this.raptor.bind('change', this.check.bind(this));
};

/**
 * Insert the placeholder if the editable element is empty.
 */
PlaceholderPlugin.prototype.enabled = function() {
    this.check(this.raptor.getHtml());
};

PlaceholderPlugin.prototype.check = function(html) {
    html = html.trim();
    if (!html || html === '<br>' || html === '<div><br></div>') {
        var raptorNode = this.raptor.getNode(),
            tag = document.createElement(this.options.tag);
        tag.innerHTML = this.options.content;
        raptorNode.innerHTML = '';
        raptorNode.appendChild(tag);
        if (this.options.select) {
            selectionSelectInner(raptorNode.childNodes[0]);
        }
        this.raptor.checkChange();
    }
};

Raptor.registerPlugin(new PlaceholderPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/placeholder/placeholder.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save.js
/**
 * Save UI plugin.
 *
 * Provides the save button UI that is enabled/disabled when the editable blocks is dirty/clean.
 * The UI will either call another plugin, or a callback when clicked.
 *
 * @plugin Button save
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */
Raptor.registerUi(new Button({
    name: 'save',
    hotkey: 'ctrl+s',

    options: {
        /**
         * Name of plugin to call when save UI is clicked. Typically `saveJson` or `saveRest`
         * @option {string} plugin
         */
        plugin: null,

        /**
         * Callback to call when save UI is clicked. The callback an plugin options are mutually exclusive.
         * @option {function} callback
         */
        callback: null
    },

    action: function() {
        if (this.getCallback()) {
            this.getCallback().call(this);
        } else if (this.getPlugin()) {
            this.getPlugin().save();
        } else {
            aNotify({
                text: tr('saveNotConfigured'),
                type: 'error'
            });
        }
    },

    init: function() {
        var result = Button.prototype.init.apply(this, arguments);

        // <strict>
        if (!this.getPlugin() &&
                !this.getCallback()) {
            handleError('Cannot find save plugin or callback for UI.');
        }
        // </strict>

        if (this.options.checkDirty !== false) {
            this.raptor.bind('dirty', this.dirty.bind(this));
            this.raptor.bind('cleaned', this.clean.bind(this));
            this.clean();
        }
        return result;
    },

    getPlugin: function() {
        if (!this.options.plugin) {
            return null;
        }
        return this.raptor.getPlugin(this.options.plugin);
    },

    getCallback: function() {
        return this.options.callback;
    },

    dirty: function() {
        aButtonEnable(this.button);
    },

    clean: function() {
        aButtonDisable(this.button);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save-json.js
/**
 * @fileOverview Contains the save JSON plugin code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The save JSON class.
 *
 * @constructor
 * @param {String} name
 * @param {Object} overrides
 */
function SaveJsonPlugin(name, overrides) {
    this.options = {
        retain: false,
        checkDirty: true
    };
    RaptorPlugin.call(this, name || 'saveJson', overrides);
    this.size = null;
}

SaveJsonPlugin.prototype = Object.create(RaptorPlugin.prototype);

Raptor.registerPlugin(new SaveJsonPlugin());

// <strict>
SaveJsonPlugin.prototype.init = function() {
    if (typeof this.options.url !== 'string' && !$.isFunction(this.options.url)) {
        handleError('Expected save JSON URL option to be a string or a function.');
    }
    if (!$.isFunction(this.options.id)) {
        handleError('Expected save JSON id option to be a function.');
    }
    if (!typeIsString(this.options.postName)) {
        handleError('Expected save JSON postName option to be a string.');
    }
};
// </strict>

/**
 * Save Raptor content.
 */
SaveJsonPlugin.prototype.save = function(saveSections) {
    // Hack save sections
    if (typeof RaptorSection !== 'undefined' && saveSections !== false) {
        RaptorSection.save(false);
    }
    var data = {};
    this.raptor.unify(function(raptor) {
        if (this.options.checkDirty === false || raptor.isDirty()) {
            raptor.clean();
            var plugin = raptor.getPlugin('saveJson');
            var id = plugin.options.id.call(plugin);
            var html = raptor.getHtml();
            if (plugin.options.data) {
                // <strict>
                if (!$.isFunction(this.options.data)) {
                    handleError('Save JSON data option is expected to be a function.');
                }
                // </strict>
                data[id] = plugin.options.data.call(this, html);
            } else {
                data[id] = html;
            }
        }
    }.bind(this));
    var post = {};
    this.size = Object.keys(data).length;
    post[this.options.postName] = JSON.stringify(data);
    if (this.options.post) {
        // <strict>
        if (!$.isFunction(this.options.post)) {
            handleError('Save JSON post option is expected to be a function.');
        }
        // </strict>
        post = this.options.post.call(this, post);
    }
    $.ajax({
            type: this.options.type || 'post',
            dataType: this.options.dataType || 'json',
            url: this.options.url,
            data: post
        })
        .done(this.done.bind(this))
        .fail(this.fail.bind(this));
};

/**
 * Done handler.
 *
 * @param {Object} data
 * @param {Integer} status
 * @param {Object} xhr
 */
SaveJsonPlugin.prototype.done = function(data, status, xhr) {
    this.raptor.unify(function(raptor) {
        if (!raptor.getPlugin('saveJson').options.checkDirty || raptor.isDirty()) {
            raptor.saved([data, status, xhr]);
        }
    });
    var message = tr('saveJsonSaved', {
        saved: this.size
    });
    if (this.options.formatResponse) {
        // <strict>
        if (!$.isFunction(this.options.formatResponse)) {
            handleError('Save JSON formatResponse option is expected to be a function.');
        }
        // </strict>
        message = this.options.formatResponse.call(this, data, status, xhr) || message;
    }
    aNotify({
        text: message,
        type: 'success'
    });
    if (!this.options.retain) {
        this.raptor.unify(function(raptor) {
            raptor.disableEditing();
        });
    }
};

/**
 * Fail handler.
 *
 * @param {Object} xhr
 */
SaveJsonPlugin.prototype.fail = function(xhr, status, error) {
    this.raptor.fire('save-failed', [xhr.responseJSON || xhr.responseText, status, xhr]);
    var message = tr('saveJsonFail', {
        failed: this.size
    });
    if (this.options.formatResponse) {
        // <strict>
        if (!$.isFunction(this.options.formatResponse)) {
            handleError('Save JSON formatResponse option is expected to be a function.');
        }
        // </strict>
        message = this.options.formatResponse.call(this, xhr.responseJSON || xhr.responseText, status, xhr) || message;
    }
    aNotify({
        text: message,
        type: 'error'
    });
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save-json.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save-rest.js
/**
 * @fileOverview Contains the save rest class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The save rest class.
 *
 * @constructor
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides Options hash
 */
function SaveRestPlugin(name, overrides) {
    this.method = 'put';
    this.options = {
        retain: false,
        checkDirty: true
    };
    RaptorPlugin.call(this, name || 'saveRest', overrides);
}

SaveRestPlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Initializes the save rest plugin.
 *
 * @returns {Element}
 */
// <strict>
SaveRestPlugin.prototype.init = function() {
    if (typeof this.options.url !== 'string' && !$.isFunction(this.options.url)) {
        debug('Expected save REST URL option to be a string or a function.');
    }
    if (!$.isFunction(this.options.data)) {
        debug('Expected save REST data option to be a function.');
    }
};
// </strict>

/**
 * Saves the selection.
 */
SaveRestPlugin.prototype.save = function() {
    this.requests = 0;
    this.errors = [];
    this.messages = [];
    this.raptor.unify(function(raptor) {
        if (this.options.checkDirty === false || raptor.isDirty()) {
            this.requests++;
            var xhr = raptor.getPlugin('saveRest').sendRequest();
            xhr.raptor = raptor;
            xhr
                .done(this.done.bind(this))
                .fail(this.fail.bind(this))
                .always(this.always.bind(this));
        }
    }.bind(this));
};

/**
 * @param {type} data
 * @param {type} status
 * @param {type} xhr
 */
SaveRestPlugin.prototype.done = function(data, status, xhr) {
    xhr.raptor.saved();
    this.messages.push(data);
};

/**
 * @param {type} xhr
 */
SaveRestPlugin.prototype.fail = function(xhr) {
    this.errors.push(xhr.responseText);
};

/**
 * Action always peformed on AJAX request
 */
SaveRestPlugin.prototype.always = function() {
    this.requests--;
    if (this.requests === 0) {
        if (this.errors.length > 0 && this.messages.length === 0) {
            aNotify({
                text: tr('saveRestFail', {
                    failed: this.errors.length
                }),
                type: 'error'
            });
        } else if (this.errors.length > 0) {
            aNotify({
                text: tr('saveRestPartial', {
                    saved: this.messages.length,
                    failed: this.errors.length
                }),
                type: 'error'
            });
        } else {
            aNotify({
                text: tr('saveRestSaved', {
                    saved: this.messages.length
                }),
                type: 'success'
            });
            if (!this.options.retain) {
                this.raptor.unify(function(raptor) {
                    raptor.disableEditing();
                });
            }
        }
    }
};

/**
 * @returns {Object} AJAX promise object
 */
SaveRestPlugin.prototype.sendRequest = function() {
    var headers = this.raptor.getPlugin('saveRest').getHeaders(),
        data = this.raptor.getPlugin('saveRest').getData(),
        url = this.raptor.getPlugin('saveRest').getURL();
    return $.ajax({
        type: this.options.type || 'post',
        dataType: this.options.dataType || 'json',
        headers: headers,
        data: data,
        url: url
    });
};

/**
 * @returns {SaveRestPlugin.prototype.getHeaders}
 */
SaveRestPlugin.prototype.getHeaders = function() {
    if (this.options.headers) {
        return this.options.headers.call(this);
    }
    return {};
};

/**
 * @returns {SaveRestPlugin.prototype.getData.data}
 */
SaveRestPlugin.prototype.getData = function() {
    // Get the data to send to the server
    this.raptor.clean();
    var content = this.raptor.getHtml(),
        data = this.options.data.call(this, content);
    data._method = this.method;
    return data;
};

/**
 * @returns {String} The URL to use for REST calls
 */
SaveRestPlugin.prototype.getURL = function() {
    if (typeof this.options.url === 'string') {
        return this.options.url;
    }
    return this.options.url.call(this);
};

Raptor.registerPlugin(new SaveRestPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/save/save-rest.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/snippet-menu/snippet-menu.js
/**
 * @fileOverview Contains the snippet menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The snippet menu class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options
 */
function SnippetMenu(options) {
    SelectMenu.call(this, {
        name: 'snippetMenu'
    });
}

SnippetMenu.prototype = Object.create(SelectMenu.prototype);

/**
 * Initialize the snippet menu.
 *
 * @returns {Element}
 */
SnippetMenu.prototype.init = function() {
    var result = SelectMenu.prototype.init.call(this);
    if (typeof this.options.snippets !== 'undefined' &&
            Object.keys(this.options.snippets).length > 0) {
        return result;
    }
};

/**
 * Inserts the snippet into the selected text.
 *
 * @todo type for name
 * @param {type} name The name of the snippet.
 */
SnippetMenu.prototype.insertSnippet = function(name) {
    selectionReplace(this.options.snippets[name]);
};

/**
 * Applies the insertion of the snippet.
 *
 * @param {type} event The click event that applies the snippet.
 */
SnippetMenu.prototype.menuItemMouseDown = function(event) {
    this.raptor.actionApply(function() {
        this.insertSnippet($(event.currentTarget).data('name'));
    }.bind(this));
};

/**
 * Previews the insertion of a snippet.
 *
 * @param {type} event The mouse event that triggers the preview.
 */
SnippetMenu.prototype.menuItemMouseEnter = function(event) {
    this.raptor.actionPreview(function() {
        this.insertSnippet($(event.currentTarget).data('name'));
    }.bind(this));
};

/**
 * Removes the preview state.
 */
SnippetMenu.prototype.menuItemMouseLeave = function() {
    this.raptor.actionPreviewRestore();
};

/**
 * Gets the menu items for the snippet menu.
 *
 * @todo check type for return
 * @returns {Element} The menu items.
 */
SnippetMenu.prototype.getMenuItems = function() {
    var items = '';
    for (var name in this.options.snippets) {
        items += this.raptor.getTemplate('snippet-menu.item', {
            name: name
        });
    }
    return items;
};

Raptor.registerUi(new SnippetMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/snippet-menu/snippet-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/special-characters/special-characters.js
/**
 * @fileOverview Contains the special characters button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

var insertCharacter = false;

/**
 * Creates an instance of the button class to insert special characters.
 */
Raptor.registerUi(new DialogButton({
    name: 'specialCharacters',
    dialogOptions: {
        width: 645
    },
    options: {
        setOrder: [
            'symbols',
            'mathematics',
            'arrows',
            'greekAlphabet'
        ],
        /**
         * Character sets available for display. From {@link http://turner.faculty.swau.edu/webstuff/htmlsymbols.html}
         */
        characterSets: {
            symbols: {
                name: tr('specialCharactersSymbols'),
                characters: [
                    ['<', '&lt;', 'less than'],
                    ['>', '&gt;', 'greater than'],
                    ['&', '&amp;', 'ampersand'],
                    ['"', '&quot;', 'quotation mark'],
                    ['&nbsp;', 'non-breaking space: \' \''],
                    ['&emsp;', 'em space: \'  \''],
                    ['&ensp;', 'en space: \' \''],
                    ['&thinsp;', 'thin space: \'\''],
                    ['&mdash;', 'em dash'],
                    ['&ndash;', 'en dash'],
                    ['&minus;', 'minus'],
                    ['-', 'hyphen'],
                    ['&oline;', 'overbar space'],
                    ['&cent;', 'cent'],
                    ['&pound;', 'pound'],
                    ['&euro;', 'euro'],
                    ['&sect;', 'section'],
                    ['&dagger;', 'dagger'],
                    ['&Dagger;', 'double dagger'],
                    ['&lsquo;', 'left single quotes'],
                    ['&rsquo;', 'right single quotes'],
                    ['\'', 'single quotes'],
                    ['&#x263a;', 'smiley face'],
                    ['&#x2605;', 'black star'],
                    ['&#x2606;', 'white star'],
                    ['&#x2610;', 'check box'],
                    ['&middot;', 'middle dot'],
                    ['&bull;', 'bullet'],
                    ['&copy;', 'copyright'],
                    ['&reg;', 'registered'],
                    ['&trade;', 'trade'],
                    ['&iquest;', 'inverted question mark'],
                    ['&iexcl;', 'inverted exclamation mark'],
                    ['&Aring;', 'Angström'],
                    ['&hellip;', 'ellipsis'],
                    ['&#x2295;', 'earth'],
                    ['&#x2299;', 'sun'],
                    ['&#x2640;', 'female'],
                    ['&#x2642;', 'male'],
                    ['&clubs;', 'clubs or shamrock'],
                    ['&spades;', 'spades'],
                    ['&hearts;', 'hearts or valentine'],
                    ['&diams;', 'diamonds'],
                    ['&loz;', 'diamond']
                ]
            },
            mathematics: {
                name: tr('specialCharactersMathematics'),
                characters: [
                    ['&lt;', 'less than'],
                    ['&le;', 'less than or equal to'],
                    ['&gt;', 'greater than'],
                    ['&ge;', 'greater than or equal to'],
                    ['&ne;', 'not equal'],
                    ['&asymp;', 'approximately equal to'],
                    ['&equiv;', 'identically equal to'],
                    ['&cong;', 'congruent to'],
                    ['&prop;', 'proportional'],
                    ['&there4;', 'therefore'],
                    ['&sum;', 'summation'],
                    ['&prod;', 'product'],
                    ['&prime;', 'prime or minutes'],
                    ['&Prime;', 'double prime or seconds'],
                    ['&Delta;', 'delta'],
                    ['&nabla;', 'del'],
                    ['&part;', 'partial'],
                    ['&int;', 'integral'],
                    ['&middot;', 'middle dot'],
                    ['&sdot;', 'dot operator'],
                    ['&bull;', 'bullet'],
                    ['&minus;', 'minus sign'],
                    ['&times;', 'multipllcation sign'],
                    ['&divide;', 'division sign'],
                    ['&frasl;', 'fraction slash, (ordinary / \\)'],
                    ['&plusmn;', 'plus or minus'],
                    ['&deg;', 'degree sign'],
                    ['&lfloor;', 'floor function'],
                    ['&rfloor;', 'floor function'],
                    ['&lceil;', 'ceiling function'],
                    ['&rceil;', 'ceiling function'],
                    ['&lowast;', 'asterisk operator, (ordinary *)'],
                    ['&oplus;', 'circled plus'],
                    ['&otimes;', 'circled times'],
                    ['&ordm;', 'masculine ordinal'],
                    ['&lang;', 'bra'],
                    ['&rang;', 'ket'],
                    ['&infin;', 'infinity'],
                    ['&pi;', 'pi'],
                    ['&frac12;', 'half'],
                    ['&alefsym;', 'aleph'],
                    ['&radic;', 'radical'],
                    ['&ang;', 'angle'],
                    ['&perp;', 'perpendicular'],
                    ['&real;', 'real'],
                    ['&isin;', 'is an element of'],
                    ['&notin;', 'not an element of'],
                    ['&empty;', 'null set'],
                    ['&sub;', 'subset of'],
                    ['&sube;', 'subset or or equal to'],
                    ['&nsub;', 'not a subset'],
                    ['&cap;', 'intersection'],
                    ['&cup;', 'union'],
                    ['&sim;', 'tilde operator (ordinary ~)'],
                    ['&Oslash;', 'slash O'],
                    ['&and;', 'logical and'],
                    ['&Lambda;', 'lambda (and)'],
                    ['&or;', 'logical or'],
                    ['&not;', 'not sign'],
                    ['&sim;', 'tilde operator (ordinary ~)'],
                    ['&rarr;', 'right arrow'],
                    ['&rArr;', 'double right arrow'],
                    ['&larr;', 'left arrow'],
                    ['&lArr;', 'left double arrow'],
                    ['&harr;', 'left right arrow'],
                    ['&hArr;', 'left right double arrow']
                ]
            },
            arrows: {
                name: tr('specialCharactersArrows'),
                characters: [
                    ['&darr;', 'down arrow'],
                    ['&dArr;', 'down double arrow'],
                    ['&uarr;', 'up arrow'],
                    ['&uArr;', 'up double arrow'],
                    ['&crarr;', 'arriage return arrow'],
                    ['&rarr;', 'right arrow'],
                    ['&rArr;', 'double right arrow'],
                    ['&larr;', 'left arrow'],
                    ['&lArr;', 'left double arrow'],
                    ['&harr;', 'left right arrow'],
                    ['&hArr;', 'left right double arrow']
                ]
            },
            greekAlphabet: {
                name: tr('specialCharactersGreekAlphabet'),
                characters: [
                    ['&alpha;', 'alpha'],
                    ['&beta;', 'beta'],
                    ['&gamma;', 'gamma'],
                    ['&delta;', 'delta'],
                    ['&epsilon;', 'epsilon'],
                    ['&zeta;', 'zeta'],
                    ['&eta;', 'eta'],
                    ['&theta;', 'theta'],
                    ['&iota;', 'iota'],
                    ['&kappa;', 'kappa'],
                    ['&lambda;', 'lambda'],
                    ['&mu;', 'mu'],
                    ['&nu;', 'nu'],
                    ['&xi;', 'xi'],
                    ['&omicron;', 'omicron'],
                    ['&pi;', 'pi'],
                    ['&rho;', 'rho'],
                    ['&sigma;', 'sigma'],
                    ['&tau;', 'tau'],
                    ['&upsilon;', 'upsilon'],
                    ['&phi;', 'phi'],
                    ['&chi;', 'chi'],
                    ['&psi;', 'psi'],
                    ['&omega;', 'omega'],
                    ['&Alpha;', 'alpha'],
                    ['&Beta;', 'beta'],
                    ['&Gamma;', 'gamma'],
                    ['&Delta;', 'delta'],
                    ['&Epsilon;', 'epsilon'],
                    ['&Zeta;', 'zeta'],
                    ['&Eta;', 'eta'],
                    ['&Theta;', 'theta'],
                    ['&Iota;', 'iota'],
                    ['&Kappa;', 'kappa'],
                    ['&Lambda;', 'lambda'],
                    ['&Mu;', 'mu'],
                    ['&Nu;', 'nu'],
                    ['&Xi;', 'xi'],
                    ['&Omicron;', 'omicron'],
                    ['&Pi;', 'pi'],
                    ['&Rho;', 'rho'],
                    ['&Sigma;', 'sigma'],
                    ['&Tau;', 'tau'],
                    ['&Upsilon;', 'upsilon'],
                    ['&Phi;', 'phi'],
                    ['&Chi;', 'chi'],
                    ['&Psi;', 'psi'],
                    ['&Omega;', 'omega']
                ]
            }
        }
    },

    applyAction: function(dialog) {
        this.raptor.actionApply(function() {
            if (insertCharacter) {
                selectionReplace(insertCharacter);
            }
            insertCharacter = false;
        });
    },

    /**
     * Prepare tabs and add buttons to tab content.
     *
     * @return {Element}
     */
    getDialogTemplate: function() {
        var html = $(this.raptor.getTemplate('special-characters.dialog')).appendTo('body').hide();
        var setKey, tabContent, character, characterButton;
        for (var setOrderIndex = 0; setOrderIndex < this.options.setOrder.length; setOrderIndex++) {
            setKey = this.options.setOrder[setOrderIndex];

            html.find('ul').append(this.raptor.getTemplate('special-characters.tab-li', {
                baseClass: this.options.baseClass,
                name: this.options.characterSets[setKey].name,
                key: setKey
            }));

            tabContent = $(this.raptor.getTemplate('special-characters.tab-content', {
                baseClass: this.options.baseClass,
                key: setKey
            }));
            var tabCharacters = [];
            for (var charactersIndex = 0; charactersIndex < this.options.characterSets[setKey].characters.length; charactersIndex++) {
                character = this.options.characterSets[setKey].characters[charactersIndex];
                characterButton = this.raptor.getTemplate('special-characters.tab-button', {
                    htmlEntity: character[0],
                    description: character[1],
                    setKey: setKey,
                    charactersIndex: charactersIndex
                });
                tabCharacters.push(characterButton);
            }
            tabContent.append(tabCharacters.join(''));
            html.find('ul').after(tabContent);
        }
        html.show();

        var _this = this;
        html.find('button').each(function() {
            aButton($(this));
        }).click(function() {
            var setKey = $(this).attr('data-setKey');
            var charactersIndex = $(this).attr('data-charactersIndex');
            insertCharacter = _this.options.characterSets[setKey].characters[charactersIndex][0];
            _this.getOkButton(_this.name).click.call(this);
        });
        aTabs(html);
        return html;
    },

    getCancelButton: function() {
        return;
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/special-characters/special-characters.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/statistics/statistics.js
/**
 * @fileOverview Contains the statistics code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

var statisticsDialog = null;

/**
 * Creates an instance of a dialog button to display the pages statistics.
 */
Raptor.registerUi(new DialogButton({
    name: 'statistics',
    options: {
        maximum: 100,
        showCountInButton: true
    },
    dialogOptions: {
        width: 350
    },

    init: function() {
        if (this.options.showCountInButton) {
            this.raptor.bind('change', this.updateButton.bind(this));
        }
        return DialogButton.prototype.init.apply(this, arguments);
    },

    applyAction: function() {
    },

    getCancelButton: function() {
    },

    getCharacterCount: function() {
        return $('<div>').html(this.raptor.getHtml()).text().trim().length;
    },

    getContent: function() {
        return $('<div>').html(this.raptor.getHtml()).text().trim();
    },

    updateButton: function() {
        var charactersRemaining = null,
            label = null,
            characterCount = this.getCharacterCount();

        // Cases where maximum has been provided
        if (this.options.maximum) {
            charactersRemaining = this.options.maximum - characterCount;
            if (charactersRemaining >= 0) {
                label = tr('statisticsButtonCharacterRemaining', {
                    charactersRemaining: charactersRemaining
                });
            } else {
                label = tr('statisticsButtonCharacterOverLimit', {
                    charactersRemaining: charactersRemaining * -1
                });
            }
        } else {
            label = tr('statisticsButtonCharacters', {
                characters: characterCount
            });
        }

        aButtonSetLabel(this.button, label);

        if (!this.options.maximum) {
            return;
        }

        // Add the error state to the button's text element if appropriate
        if (charactersRemaining < 0) {
            this.button.addClass('ui-state-error').removeClass('ui-state-default');
        } else{
            // Add the highlight class if the remaining characters are in the "sweet zone"
            if (charactersRemaining >= 0 && charactersRemaining <= 15) {
                this.button.addClass('ui-state-highlight').removeClass('ui-state-error ui-state-default');
            } else {
                this.button.removeClass('ui-state-highlight ui-state-error').addClass('ui-state-default');
            }
        }
    },

    getButton: function() {
        if (!this.button) {
            Button.prototype.getButton.call(this);
            aButton(this.button, {
                text: true
            });
            if (this.options.showCountInButton) {
                this.updateButton();
            }
        }
        return this.button;
    },

    getDialogTemplate: function() {
        return $(this.raptor.getTemplate('statistics.dialog', this.options));
    },

    /**
     * Process and return the statistics dialog template.
     *
     * @return {jQuery} The processed statistics dialog template
     */
    openDialog: function() {
        var dialog = this.getDialog(),
            content = this.getContent();

        // If maximum has not been set, use infinity
        var charactersRemaining = this.options.maximum ? this.options.maximum - content.length : '&infin;';
        if (typeIsNumber(charactersRemaining) && charactersRemaining < 0) {
            dialog.find('[data-name=truncation]').html(tr('statisticsDialogTruncated', {
                'limit': this.options.maximum
            }));
        } else {
            dialog.find('[data-name=truncation]').html(tr('statisticsDialogNotTruncated'));
        }

        var totalWords = content.split(' ').length;
        if (totalWords === 1) {
            dialog.find('[data-name=words]').html(tr('statisticsDialogWord', {
                words: totalWords
            }));
        } else {
            dialog.find('[data-name=words]').html(tr('statisticsDialogWords', {
                words: totalWords
            }));
        }

        var totalSentences = content.split('. ').length;
        if (totalSentences === 1) {
            dialog.find('[data-name=sentences]').html(tr('statisticsDialogSentence', {
                sentences: totalSentences
            }));
        } else {
            dialog.find('[data-name=sentences]').html(tr('statisticsDialogSentences', {
                sentences: totalSentences
            }));
        }

        var characters = null;
        if (charactersRemaining >= 0 || !typeIsNumber(charactersRemaining)) {
            dialog.find('[data-name=characters]').html(tr('statisticsDialogCharactersRemaining', {
                characters: content.length,
                charactersRemaining: charactersRemaining
            }));
        } else {
            dialog.find('[data-name=characters]').html(tr('statisticsDialogCharactersOverLimit', {
                characters: content.length,
                charactersRemaining: charactersRemaining * -1
            }));
        }
        DialogButton.prototype.openDialog.call(this);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/statistics/statistics.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-cell-button.js
/**
 * @fileOverview Contains the table cell button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The table cell button class.
 *
 * @constructor
 * @augments FilteredPreviewButton
 *
 * @param {Object} options Options hash.
 */
function TableCellButton(options) {
    FilteredPreviewButton.call(this, options);
}

TableCellButton.prototype = Object.create(FilteredPreviewButton.prototype);

/**
 * @todo
 *
 * @param {RangySelection} range The selection to get the cell from.
 * @returns {Element|null}
 */
TableCellButton.prototype.getElement = function(range) {
    var cell = $(range.commonAncestorContainer.parentNode).closest('td, th');
    if (cell.length && !cell.find(this.raptor.getElement()).length) {
        return cell[0];
    }
    return null;
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-cell-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-create.js
/**
 * @fileOverview Contains the table menu class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The table menu class.
 *
 * @constructor
 * @augments Menu
 *
 * @param {Object} options Options hash.
 */
function TableMenu(options) {
    Menu.call(this, {
        name: 'tableCreate'
    });
}

TableMenu.prototype = Object.create(Menu.prototype);

/**
 * Creates the menu table.
 *
 * @param event The mouse event to create the table.
 */
TableMenu.prototype.createTable = function(event) {
    this.raptor.actionApply(function() {
        var table = tableCreate(event.target.cellIndex + 1, event.target.parentNode.rowIndex + 1, {
            placeHolder: '&nbsp;'
        });
        table.className = this.options.cssPrefix + 'table';
        selectionReplace(table);
    }.bind(this));
};

/**
 * Highlights the cells inside the table menu.
 *
 * @param event The mouse event to trigger the function.
 */
TableMenu.prototype.highlight = function(event) {
    var cells = tableCellsInRange(this.menuTable.get(0), {
            x: 0,
            y: 0
        }, {
            x: event.target.cellIndex,
            y: event.target.parentNode.rowIndex
        });

    // highlight cells in menu
    this.highlightRemove(event);
    $(cells).addClass(this.options.baseClass + '-menu-hover');

    // Preview create
    this.raptor.actionPreview(function() {
        var table = tableCreate(event.target.cellIndex + 1, event.target.parentNode.rowIndex + 1, {
            placeHolder: '&nbsp;'
        });
        table.className = this.options.cssPrefix + 'table';
        selectionReplace(table);
    }.bind(this));
};

/**
 * Removes the highlight from the table menu.
 *
 * @param event The mouse event to trigger the function.
 */
TableMenu.prototype.highlightRemove = function(event) {
    this.menuTable
        .find('.' + this.options.baseClass + '-menu-hover')
        .removeClass(this.options.baseClass + '-menu-hover');
    this.raptor.actionPreviewRestore();
};

/**
 * Prepares and returns the menu for use in the Raptor UI.
 * @returns {Element}
 */
TableMenu.prototype.getMenu = function() {
    if (!this.menu) {
        this.menuContent = this.raptor.getTemplate('table.create-menu', this.options);
        Menu.prototype.getMenu.call(this)
            .on('click', 'td', this.createTable.bind(this))
            .on('mouseenter', 'td', this.highlight.bind(this))
            .mouseleave(this.highlightRemove.bind(this));
        this.menuTable = this.menu.find('table:eq(0)');
    }
    return this.menu;
};

Raptor.registerUi(new TableMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-create.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-delete-column.js
/**
 * @fileOverview Contains the delete column button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a table cell button to delete a column from a table.
 */
Raptor.registerUi(new TableCellButton({
    name: 'tableDeleteColumn',
    applyToElement: function(cell) {
        var position = tableGetCellIndex(cell),
            table = cell.parentNode.parentNode.parentNode,
            nextCell;
        tableDeleteColumn(cell.parentNode.parentNode.parentNode, position.x);
        if (tableIsEmpty(table)) {
            table.parentNode.removeChild(table);
            return;
        }
        nextCell = tableGetCellByIndex(table, position);
        if (!nextCell && position.x > 0) {
            nextCell = tableGetCellByIndex(table, {
                x: position.x - 1,
                y: position.y
            });
        }
        selectionSelectInner(nextCell);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-delete-column.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-delete-row.js
/**
 * @fileOverview Contains the delete column button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a table cell button to delete a row from a table.
 */
Raptor.registerUi(new TableCellButton({
    name: 'tableDeleteRow',
    applyToElement: function(cell) {
        var position = tableGetCellIndex(cell),
            table = cell.parentNode.parentNode.parentNode,
            nextCell;
        tableDeleteRow(cell.parentNode.parentNode.parentNode, position.y);
        if (tableIsEmpty(table)) {
            table.parentNode.removeChild(table);
            return;
        }
        nextCell = tableGetCellByIndex(table, position);
        if (!nextCell && position.y > 0) {
            nextCell = tableGetCellByIndex(table, {
                x: position.x,
                y: position.y - 1
            });
        }
        selectionSelectInner(nextCell);
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-delete-row.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-insert-column.js
/**
 * @fileOverview Contains the insert column button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a table cell button to insert a column into a table.
 */
Raptor.registerUi(new TableCellButton({
    name: 'tableInsertColumn',
    applyToElement: function(cell) {
        tableInsertColumn(cell.parentNode.parentNode.parentNode, tableGetCellIndex(cell).x + 1, {
            placeHolder: '&nbsp;'
        });
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-insert-column.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-insert-row.js
/**
 * @fileOverview Contains the insert row button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a table cell button to insert a row into a table.
 */
Raptor.registerUi(new TableCellButton({
    name: 'tableInsertRow',
    applyToElement: function(cell) {
        tableInsertRow(cell.parentNode.parentNode.parentNode, tableGetCellIndex(cell).y + 1, {
            placeHolder: '&nbsp;'
        });
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-insert-row.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-merge-cells.js
/**
 * @fileOverview Contains the split cell button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a button to merge the selected cells of a table.
 */
Raptor.registerUi(new Button({
    name: 'tableMergeCells',
    action: function() {
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-merge-cells.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-split-cells.js
/**
 * @fileOverview Contains the split cells button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a button to split the selected cell of a table.
 */
Raptor.registerUi(new Button({
    name: 'tableSplitCells',
    action: function() {
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-split-cells.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-support.js
/**
 * @fileOverview Contains the table helper functions.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

var tableSupportDragging = false,
    tableSupportStartCell = null;

/**
 * The supporting table class.
 *
 * @constructor
 *
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides Options hash.
 */
function TableSupport(name, overrides) {
    RaptorPlugin.call(this, name || 'tableSupport', overrides);
}

TableSupport.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Initialize the table support class.
 */
TableSupport.prototype.init = function() {
    this.raptor.bind('selection-customise', this.selectionCustomise.bind(this));
    this.raptor.bind('insert-nodes', this.insertNodes.bind(this));
    this.raptor.registerHotkey('tab', this.tabToNextCell.bind(this));
    this.raptor.registerHotkey('shift+tab', this.tabToPrevCell.bind(this));
    this.raptor.getElement()
        .on('mousedown', 'tbody td', this.cellMouseDown.bind(this))
        .on('mouseover', 'tbody td', this.cellMouseOver.bind(this))
        .mouseup(this.cellMouseUp.bind(this));
};

/**
 * @todo i think this has something to do with the cell selection but i'm not sure
 * @returns {Range[]}
 */
TableSupport.prototype.selectionCustomise = function() {
    var ranges = [],
        range;
    $('.' + this.options.baseClass + '-cell-selected').each(function() {
        range = rangy.createRange();
        range.selectNodeContents(this);
        ranges.push(range);
    });
    return ranges;
};

TableSupport.prototype.insertNodes = function(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].tagName === 'TABLE') {
            nodes[i].classList.add(this.options.cssPrefix + 'table');
        }
    }
};

/**
 * Event handler for mouse down.
 *
 * @param event The mouse event to trigger the function.
 */
TableSupport.prototype.cellMouseDown = function(event) {
    if (this.raptor.isEditing()) {
        tableSupportStartCell = tableGetCellIndex(event.target);
        if (tableSupportStartCell !== null) {
            tableSupportDragging = true;
            $(event.target).closest('table').addClass(this.options.baseClass + '-selected');
        }
    }
};

/**
 * Event handler for mouse up.
 *
 * @param event The mouse event to trigger the function.
 */
TableSupport.prototype.cellMouseUp = function(event) {
    tableSupportDragging = false;
    var cell = $(event.target).closest('td'),
        deselect = false;
    if (cell.length > 0 && tableSupportStartCell !== null) {
        var index = tableGetCellIndex(cell.get(0));
        if (index === null ||
                (index.x == tableSupportStartCell.x &&
                index.y == tableSupportStartCell.y)) {
            deselect = true;
        }
    } else {
        deselect = true;
    }
    if (deselect) {
        $('.' + this.options.baseClass + '-selected').removeClass(this.options.baseClass + '-selected');
        $('.' + this.options.baseClass + '-cell-selected').removeClass(this.options.baseClass + '-cell-selected');
    }
};

/**
 * Event handler for mouse hover.
 *
 * @param event The mouse event to trigger the function.
 */
TableSupport.prototype.cellMouseOver = function(event) {
    if (tableSupportDragging) {
        var cells = tableCellsInRange($(event.target).closest('table').get(0), tableSupportStartCell, tableGetCellIndex(event.target));
        $('.' + this.options.baseClass + '-cell-selected').removeClass(this.options.baseClass + '-cell-selected');
        $(cells).addClass(this.options.baseClass + '-cell-selected');
        rangy.getSelection().removeAllRanges();
    }
};

/**
 * Handles tabbing to the next table cell.
 */
TableSupport.prototype.tabToNextCell = function() {
    var range = rangy.getSelection().getRangeAt(0),
        parent = rangeGetCommonAncestor(range),
        cell = $(parent).closest('td');
    if (cell.length === 0) {
        return false;
    }
    var next = cell.next('td');
    if (next.length === 0) {
        next = cell.closest('tr').next('tr').find('td:first');
        if (next.length === 0) {
            next = cell.closest('tbody').find('td:first');
        }
    }
    rangeSelectElementContent(range, next);
    rangy.getSelection().setSingleRange(range);
};

/**
 * Handles tabbing to the next table cell.
 */
TableSupport.prototype.tabToPrevCell = function() {
    var range = rangy.getSelection().getRangeAt(0),
        parent = rangeGetCommonAncestor(range),
        cell = $(parent).closest('td');
    if (cell.length === 0) {
        return false;
    }
    var prev = cell.prev('td');
    if (prev.length === 0) {
        prev = cell.closest('tr').prev('tr').find('td:last');
        if (prev.length === 0) {
            prev = cell.closest('tbody').find('td:last');
        }
    }
    rangeSelectElementContent(range, prev);
    rangy.getSelection().setSingleRange(range);
};

Raptor.registerPlugin(new TableSupport());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/table/table-support.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/tag-menu/tag-menu.js
/**
 * Tag menu plugin.
 *
 * @plugin SelectMenu tagMenu
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The tag menu class.
 *
 * @constructor
 * @augments SelectMenu
 *
 * @param {Object} options Options hash.
 */
function TagMenu(options) {
    this.options = {
        /**
         * List of tags and their translated name.
         * @option {Object.<string, string>} tags
         */
        tags: {
            na: tr('tagMenuTagNA'),
            p: tr('tagMenuTagP'),
            h1: tr('tagMenuTagH1'),
            h2: tr('tagMenuTagH2'),
            h3: tr('tagMenuTagH3'),
            h4: tr('tagMenuTagH4'),
            div: tr('tagMenuTagDiv'),
            pre: tr('tagMenuTagPre'),
            address: tr('tagMenuTagAddress')
        }
    };

    SelectMenu.call(this, {
        name: 'tagMenu'
    });
}

TagMenu.prototype = Object.create(SelectMenu.prototype);

/**
 * Initializes the tag menu.
 */
TagMenu.prototype.init = function() {
    this.raptor.bind('selectionChange', this.updateButton.bind(this));
    return SelectMenu.prototype.init.apply(this, arguments);
};

/**
 * Changes the tags on the selected element(s).
 *
 * @param {HTML} tag The new tag.
 */
TagMenu.prototype.changeTag = function(tag) {
    // Prevent injection of illegal tags
    if (typeof tag === 'undefined' || tag === 'na') {
        return;
    }

    var selectedElement = selectionGetElement(),
        limitElement = this.raptor.getElement();
    if (selectedElement && !selectedElement.is(limitElement)) {
        var cell = selectedElement.closest('td, li, #' + limitElement.attr('id'));
        if (cell.length !== 0) {
            limitElement = cell;
        }
    }

    selectionChangeTags(tag, [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'div', 'pre', 'address'
    ], limitElement);
};

/**
 * Applies the tag change.
 *
 * @param event The mouse event to trigger the function.
 */
TagMenu.prototype.menuItemClick = function(event) {
    SelectMenu.prototype.menuItemClick.apply(this, arguments);
    this.raptor.actionApply(function() {
        this.changeTag($(event.currentTarget).data('value'));
    }.bind(this));
};

/**
 * Generates a preview state for a change of tag.
 *
 * @param event The mouse event to trigger the preview.
 */
TagMenu.prototype.menuItemMouseEnter = function(event) {
    this.raptor.actionPreview(function() {
        this.changeTag($(event.currentTarget).data('value'));
    }.bind(this));
};

/**
 * Restores the tag menu from it's preview state.
 *
 * @param event The mouse event to trigger the restoration of the tag menu.
 */
TagMenu.prototype.menuItemMouseLeave = function(event) {
    this.raptor.actionPreviewRestore();
};

/**
 * Updates the display of the tag menu button.
 */
TagMenu.prototype.updateButton = function() {
    var tag = selectionGetElements()[0],
        button = this.getButton().getButton();
    if (!tag) {
        return;
    }
    var tagName = tag.tagName.toLowerCase(),
        option = this.getMenu().find('[data-value=' + tagName + ']');
    if (option.length) {
        aButtonSetLabel(button, option.html());
    } else {
        aButtonSetLabel(button, tr('tagMenuTagNA'));
    }
//    if (this.raptor.getElement()[0] === tag) {
//        aButtonDisable(button);
//    } else {
//        aButtonEnable(button);
//    }
};

/**
 * Prepares and returns the menu items for use in the raptor UI.
 * @returns {String}
 */
TagMenu.prototype.getMenuItems = function() {
    var result = '';
    for (var tag in this.options.tags) {
        result += this.raptor.getTemplate('tag-menu.item', {
            tag: tag,
            name: this.options.tags[tag]
        });
    }
    return result;
};

Raptor.registerUi(new TagMenu());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/tag-menu/tag-menu.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/text-align-button.js
/**
 * @fileOverview Contains the text align button class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * The text align button class.
 *
 * @constructor
 * @augments PreviewToggleButton
 *
 * @param {Object} options Options hash.
 */
function TextAlignButton(options) {
    PreviewToggleButton.call(this, options);
}

TextAlignButton.prototype = Object.create(PreviewToggleButton.prototype);

TextAlignButton.prototype.action = function() {
    selectionToggleBlockClasses([
        this.getClass()
    ], [
        this.options.cssPrefix + 'center',
        this.options.cssPrefix + 'left',
        this.options.cssPrefix + 'right',
        this.options.cssPrefix + 'justify'
    ], this.raptor.getElement(), 'span');
    this.selectionChange();
};

TextAlignButton.prototype.selectionToggle = function() {
    return rangy.getSelection().getAllRanges().length > 0 &&
        selectionContains('.' + this.getClass(), this.raptor.getElement());
};;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/text-align-button.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/center.js
/**
 * @fileOverview Contains the center align button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a text align button to align text center.
 */
Raptor.registerUi(new TextAlignButton({
    name: 'alignCenter',
    getClass: function() {
        return this.options.cssPrefix + 'center';
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/center.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/justify.js
/**
 * @fileOverview Contains the justify text button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a text align button to justify text.
 */
Raptor.registerUi(new TextAlignButton({
    name: 'alignJustify',
    getClass: function() {
        return this.options.cssPrefix + 'justify';
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/justify.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/left.js
/**
 * @fileOverview Contains the left align button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a text align button to align text left.
 */
Raptor.registerUi(new TextAlignButton({
    name: 'alignLeft',
    getClass: function() {
        return this.options.cssPrefix + 'left';
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/left.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/right.js
/**
 * @fileOverview Contains the right align button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates a text align button to align text right.
 */
Raptor.registerUi(new TextAlignButton({
    name: 'alignRight',
    getClass: function() {
        return this.options.cssPrefix + 'right';
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-align/right.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/bold.js
/**
 * @fileOverview Contains the bold button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the bold class to a selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textBold',
    hotkey: 'ctrl+b',
    tag: 'strong',
    classes: ['bold']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/bold.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/italic.js
/**
 * @fileOverview Contains the italic button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the italic class to a
 * selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textItalic',
    hotkey: 'ctrl+i',
    tag: 'em',
    classes: ['italic']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/italic.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/strike.js
/**
 * @fileOverview Contains the strike button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the strike class to a
 * selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textStrike',
    tag: 'del',
    classes: ['strike']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/strike.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/block-quote.js
/**
 * @fileOverview Contains the block quote button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the preview toggle button to insert a block quote.
 */
Raptor.registerUi(new Button({
    name: 'textBlockQuote',
    action: function() {
        document.execCommand('formatBlock', false, '<blockquote>');
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/block-quote.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/size-decrease.js
/**
 * @fileOverview Contains the text size decrease button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the preview button to apply the text size decrease
 * class to a selection.
 */
Raptor.registerUi(new PreviewButton({
    name: 'textSizeDecrease',
    action: function() {
        selectionExpandToWord();
        this.raptor.selectionConstrain();
        selectionInverseWrapWithTagClass('small', this.options.cssPrefix + 'small', 'big', this.options.cssPrefix + 'big');
        this.raptor.getElement().find('small.' + this.options.cssPrefix + 'small:empty, big.' + this.options.cssPrefix + 'big:empty').remove();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/size-decrease.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/size-increase.js
/**
 * @fileOverview Contains the text size increase button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the preview button to apply the text size increase
 * class to a selection.
 */
Raptor.registerUi(new PreviewButton({
    name: 'textSizeIncrease',
    action: function() {
        selectionExpandToWord();
        this.raptor.selectionConstrain();
        selectionInverseWrapWithTagClass('big', this.options.cssPrefix + 'big', 'small', this.options.cssPrefix + 'small');
        this.raptor.getElement().find('small.' + this.options.cssPrefix + 'small:empty, big.' + this.options.cssPrefix + 'big:empty').remove();
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/size-increase.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/underline.js
/**
 * @fileOverview Contains the underline button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the underline class to a selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textUnderline',
    hotkey: 'ctrl+u',
    tag: 'u',
    classes: ['underline']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/underline.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/sub.js
/**
 * @fileOverview Contains the subscript button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the subscript class to
 * a selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textSub',
    tag: 'sub',
    classes: ['sub']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/sub.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/super.js
/**
 * @fileOverview Contains the superscript button code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the CSS applier button to apply the superscript class
 * to a selection.
 */
Raptor.registerUi(new CSSClassApplierButton({
    name: 'textSuper',
    tag: 'sup',
    classes: ['sup']
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/text-style/super.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/tool-tip/tool-tip.js
/**
 * @fileOverview Stylised tooltip plugin.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen david@panmedia.co.nz
 */
function ToolTipPlugin(name, overrides) {
    RaptorPlugin.call(this, name || 'toolTip', overrides);
}

ToolTipPlugin.prototype = Object.create(RaptorPlugin.prototype);

ToolTipPlugin.prototype.init = function() {
    this.raptor.bind('layoutReady', function(node) {
        $(node)
            .on('mouseover', '[title]', function(event) {
                $(this)
                    .attr('data-title', $(this).attr('title'))
                    .removeAttr('title');
            });
    });
};

Raptor.registerPlugin(new ToolTipPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/tool-tip/tool-tip.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/unsaved-edit-warning/unsaved-edit-warning.js
/**
 * @fileOverview Contains the unsaved edit warning plugin class code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

var unsavedEditWarningDirty = 0,
    unsavedEditWarningElement = null;

/**
 * The unsaved edit warning plugin.
 *
 * @constructor
 * @augments RaptorPlugin
 *
 * @param {String} name
 * @param {Object} overrides Options hash.
 */
function UnsavedEditWarningPlugin(name, overrides) {
    RaptorPlugin.call(this, name || 'unsavedEditWarning', overrides);
}

UnsavedEditWarningPlugin.prototype = Object.create(RaptorPlugin.prototype);

/**
 * Enables the unsaved edit warning plugin.
 *
 * @todo raptor details
 * @param {type} raptor
 */
UnsavedEditWarningPlugin.prototype.enable = function(raptor) {
    this.raptor.bind('dirty', this.show.bind(this));
    this.raptor.bind('cleaned', this.hide.bind(this));
};

/**
 * Shows the unsaved edit warning.
 */
UnsavedEditWarningPlugin.prototype.show = function() {
    unsavedEditWarningDirty++;
    elementBringToTop(this.getElement());
    this.getElement().addClass(this.options.baseClass + '-visible');
};

/**
 * Hides the unsaved edit warning.
 *
 * @param event The mouse event that triggers the function.
 */
UnsavedEditWarningPlugin.prototype.hide = function(event) {
    if (--unsavedEditWarningDirty === 0) {
        this.getElement().removeClass(this.options.baseClass + '-visible');
    }
};

/**
 * Prepares and returns the unsaved edit warning element for use in the Raptor UI.
 *
 * @todo instance details
 * @param {type} instance
 * @returns {Element}
 */
UnsavedEditWarningPlugin.prototype.getElement = function() {
    if (!unsavedEditWarningElement) {
        var dirtyClass = 'raptor-plugin-unsaved-edit-warning-dirty';
        unsavedEditWarningElement = $(this.raptor.getTemplate('unsaved-edit-warning.warning', this.options))
            .mouseenter(function() {
                Raptor.eachInstance(function(raptor) {
                    if (raptor.isDirty()) {
                        raptor.getElement().addClass(dirtyClass);
                    }
                });
            })
            .mouseleave(function() {
                $('.' + dirtyClass).removeClass(dirtyClass);            })
            .appendTo('body');
    }
    return unsavedEditWarningElement;
};

Raptor.registerPlugin(new UnsavedEditWarningPlugin());
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/unsaved-edit-warning/unsaved-edit-warning.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/view-source/view-source.js
/**
 * @fileOverview Contains the view source dialog code.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * Creates an instance of the dialog button to open the view source dialog.
 */
Raptor.registerUi(new DialogButton({
    name: 'viewSource',
    dialogOptions: {
        width: 600,
        height: 400,
        minWidth: 400,
        minHeight: 400
    },

    /**
     * Replace the editing element's content with the HTML from the dialog's textarea
     *
     * @param  {Element} dialog
     */
    applyAction: function(dialog) {
        var html = dialog.find('textarea').val();
        this.raptor.actionApply(function() {
            this.raptor.setHtml(html);
            selectionSelectStart(this.raptor.getElement().first());
            this.raptor.checkSelectionChange();
        }.bind(this));
    },

    /**
     * Update the dialog's text area with the current HTML.
     */
    openDialog: function() {
        var textarea = this.getDialog().find('textarea');
        textarea.val(this.raptor.getHtml());
        DialogButton.prototype.openDialog.call(this);
        textarea.select();
    },

    /**
     * @return {Element}
     */
    getDialogTemplate: function() {
        return $('<div>').html(this.raptor.getTemplate('view-source.dialog', this.options));
    }
}));
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/plugins/view-source/view-source.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/base.js
/**
 * @fileOverview Default options for Raptor.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @namespace Default options for Raptor.
 */
Raptor.globalDefaults = {
    /**
     * @type Object Default layouts to use.
     */
    layouts: {},

    /**
     * Plugins option overrides.
     *
     * @type Object
     */
    plugins: {},

    /**
     * UI option overrides.
     *
     * @type Object
     */
    ui: {},

    /**
     * Default events to bind.
     *
     * @type Object
     */
    bind: {},

    /**
     * Namespace used for persistence to prevent conflicting with other stored
     * values.
     *
     * @type String
     */
    namespace: null,

    /**
     * Switch to indicated that some events should be automatically applied to
     * all editors that are 'unified'
     *
     * @type boolean
     */
    unify: true,

    /**
     * Switch to indicate whether or not to stored persistent values, if set to
     * false the persist function will always return null
     *
     * @type boolean
     */
    persistence: true,

    /**
     * The name to store persistent values under
     * @type String
     */
    persistenceName: 'uiEditor',

    /**
     * Switch to indicate whether or not to a warning should pop up when the
     * user navigates aways from the page and there are unsaved changes
     *
     * @type boolean
     */
    unloadWarning: true,

    /**
     * Switch to automatically enabled editing on the element
     *
     * @type boolean
     */
    autoEnable: false,

    /**
     * Only enable editing on certian parts of the element
     *
     * @type {jQuerySelector}
     */
    partialEdit: false,

    /**
     * Automatically select the editable content when editing is enabled.
     *
     * @type boolean
     */
    autoSelect: 'end',

    /**
     * Switch to specify if the editor should automatically enable all plugins,
     * if set to false, only the plugins specified in the 'plugins' option
     * object will be enabled
     *
     * @type boolean
     */
    enablePlugins: true,

    /**
     * An array of explicitly disabled plugins.
     *
     * @type String[]
     */
    disabledPlugins: [],

    /**
     * Switch to specify if the editor should automatically enable all UI, if
     * set to false, only the UI specified in the {@link Raptor.defaults.ui}
     * option object will be enabled
     *
     * @type boolean
     */
    enableUi: true,

    /**
     * An array of explicitly disabled UI elements.
     *
     * @type String[]
     */
    disabledUi: [],

    /**
     * Switch to indicate that the element the editor is being applied to should
     * be replaced with a div (useful for textareas), the value/html of the
     * replaced element will be automatically updated when the editor element is
     * changed
     *
     * @type boolean
     */
    replace: false,

    /**
     * A list of styles that will be copied from the replaced element and
     * applied to the editor replacement element
     *
     * @type String[]
     */
    replaceStyle: [
        'display', 'position', 'float', 'width',
        'padding-left', 'padding-right', 'padding-top', 'padding-bottom',
        'margin-left', 'margin-right', 'margin-top', 'margin-bottom'
    ],

    /**
     *
     * @type String
     */
    baseClass: 'raptor',

    /**
     * CSS class prefix that is prepended to inserted elements classes.
     * E.g. "cms-bold"
     *
     * @type String
     */
    cssPrefix: 'cms-',

    draggable: true
};
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/base.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/full.js
/**
 * @fileOverview Contains the full options preset.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 * @author Michael Robinson <michael@panmedia.co.nz>
 * @author Melissa Richards <melissa@panmedia.co.nz>
 */

/**
 * @namespace Full options for Raptor.
 */
Raptor.registerPreset({
    name: 'full',
    plugins: {
        imageSwap: {
            chooser: 'insertFile'
        }
    },
    layouts: {
        toolbar: {
            uiOrder: [
                ['logo'],
                ['save', 'cancel'],
                ['dockToScreen', 'dockToElement', 'guides'],
                ['viewSource'],
                ['historyUndo', 'historyRedo'],
                ['alignLeft', 'alignCenter', 'alignJustify', 'alignRight'],
                ['textBold', 'textItalic', 'textUnderline', 'textStrike'],
                ['textSuper', 'textSub'],
                ['listUnordered', 'listOrdered'],
                ['hrCreate', 'textBlockQuote'],
                ['textSizeDecrease', 'textSizeIncrease', 'fontFamilyMenu'],
                ['clearFormatting', 'cleanBlock'],
                ['linkCreate', 'linkRemove'],
                ['embed', 'insertFile'],
                ['floatLeft', 'floatNone', 'floatRight'],
                ['colorMenuBasic'],
                ['tagMenu'],
                ['classMenu'],
                ['snippetMenu', 'specialCharacters'],
                ['tableCreate', 'tableInsertRow', 'tableDeleteRow', 'tableInsertColumn', 'tableDeleteColumn'],
                ['languageMenu'],
                ['statistics']
            ]
        },
        hoverPanel: {
            uiOrder: [
                ['clickButtonToEdit']
            ]
        },
        elementHoverPanel: {
            elements: 'img',
            uiOrder: [
                ['imageResize', 'imageSwap', 'close']
            ]
        }
    }
}, true);
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/full.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/micro.js
/**
 * @fileOverview Contains the micro options preset.
 * @license http://www.raptor-editor.com/license
 * @author David Neilsen <david@panmedia.co.nz>
 */

/**
 * @namespace Micro options for Raptor.
 */
Raptor.registerPreset({
    name: 'micro',
    layouts: {
        toolbar: {
            uiOrder: [
                ['logo'],
                ['save', 'cancel'],
                ['dockToScreen', 'dockToElement'],
                ['historyUndo', 'historyRedo'],
                ['specialCharacters'],
                ['languageMenu'],
                ['statistics']
            ]
        },
        hoverPanel: {
            uiOrder: [
                ['clickButtonToEdit', 'revisions']
            ]
        }
    },
    plugins: {
        placeholder: false,
        paste: {
            panels: [
                'plain-text'
            ]
        },
        noBreak: {
            enabled: true
        }
    }
});
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/micro.js
;
// File start: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/inline.js
/**
 * @fileOverview Contains the inline preset.
 * @license http://www.raptor-editor.com/license
 *
 * @author David Neilsen <david@panmedia.co.nz>
 */

/**
 * @namespace Inline preset for Raptor.
 */
Raptor.registerPreset({
    name: 'inline',
    classes: 'raptor-editing-inline',
    autoEnable: true,
    draggable: false,
    unify: false,
    unloadWarning: false,
    reloadOnDisable: true,
    plugins: {
        unsavedEditWarning: false,
        dock: {
            dockToElement: true,
            docked: true,
            persist: false
        }
    },
    layouts: {
        toolbar: {
            uiOrder: [
                ['textBold', 'textItalic', 'textUnderline', 'textStrike'],
                ['colorMenuBasic'],
                ['textBlockQuote'],
                ['listOrdered', 'listUnordered'],
                ['textSizeDecrease', 'textSizeIncrease'],
                ['linkCreate', 'linkRemove']
            ]
        }
    }
});
;
// File end: /var/deployments/www.raptor-editor.com.3/raptor-gold/raptor-editor/src/presets/inline.js
})();