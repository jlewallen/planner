(function($) {   
  $.templates({
    calendarWidgetMain: "<div class='calendar-widget-container'><div class='calendar-widget'>{{for rows tmpl='calendarWidgetRow' /}}</div></div>",
    calendarWidgetRow: "<div class='table-row'>{{if true tmpl='calendarWidgetTableMain'/}}{{if true tmpl='calendarWidgetTableGrid'/}}</div>",
    calendarWidgetTableMain: "<table cellpadding='0' cellspacing='0' class='table-main'><tbody><tr>{{for columns tmpl='calendarWidgetTableMainColumn' /}}</tr></tbody></table>",
    calendarWidgetTableGrid: "<table cellpadding='0' cellspacing='0' class='table-grid'><tbody><tr>{{for columns tmpl='calendarWidgetTableGridColumn' /}}</tr></tbody></table>",
    calendarWidgetTableMainColumn: "<td class='box'>&nbsp;</td>",
    calendarWidgetTableGridColumn: "<td class='st-dtitle'><span>{{>title}}</span></td>",
    calendarWidgetEntryCellBox: "<div class='st-c-pos'><div class='st-ad-mpad rb-n' style='border: 1px solid {{>border}}; color: {{>text}}; background-color: {{>color}}' class='rb-ni'>{{>title}}</div></div></div>",
    calendarWidgetEntryCellSimple: "<div class='st-c-pos'><div class='ca-evp23 te' style='color: {{>text}}'>{{>title}}</div></div>"
  });

  window.EntryRow = function(dom) {
    var self = this;
    self._dom = dom;
    self._cells = dom.find("td");
    self._occupied = self._cells.map(function(e) {
      return false;
    });
  };

  window.EntryRow.prototype.available = function(s, e) {
    var self = this;
    for (var i = s; i <= e; ++i) {
      if (self._occupied[i]) {
        return false;
      }
    }
    return true;
  };

  window.EntryRow.prototype.fill = function(s, e, model) {
    var self = this;
    var cell = $(self._cells[s]);
    cell.html($.render.calendarWidgetEntryCellBox(model));
    for (var i = s; i <= e; ++i) {
      if (i != s) {
        $(self._cells[i]).remove();
      }
      self._occupied[i] = true;
    }
    cell.attr("colspan", e - s + 1);
    return cell;
  };

  window.EntryRowSet = function(dom) {
    var self = this;
    self._width = dom.find("td").size();
    self._dom = dom;
    self._rows = [];
  };

  window.EntryRowSet.prototype.findRowFor = function(entryModel) {
    var self = this;
    var available = $.grep(self._rows, function(e) {
      return e.available(entryModel.s, entryModel.e);
    });
    if (available.length == 0) {
      var tr = $("<tr></tr>");
      for (var i = 0; i < self._width; ++i) {
        tr = tr.append("<td class='st-c st-s'>&nbsp;</td>");
      }
      self._dom.append(tr);
      var row = new EntryRow(tr);
      self._rows.push(row);
      return row;
    }
    return available[0];
  };

  window.EntryRowSet.prototype.add = function(entryModel) {
    var self = this;
    var row = self.findRowFor(entryModel);
    return row.fill(entryModel.s, entryModel.e, entryModel);
  };

  window.CalendarWidget = function(dom, model) {
    var self = this;
    self._dom = dom;
    self._model = model;
    self._blank = $($.render.calendarWidgetMain(model));
    self._blank.find(".table-row").each(function(i, e) {
      $(e).css("top", i * 200 + "px").css("height", "200px");
    });
    self._dom.html(self._blank).css("height", model.rows.length * 200);
    self._rows = dom.find('.table-grid tbody').map(function(i, m) {
      return new EntryRowSet($(m), null, null);
    });

  };

  window.CalendarWidget.prototype.add = function(entryModel) {
    var self = this;
    var width = 7;
    var row = (entryModel.s / width) | 0;
    var s = entryModel.s;
    var e = entryModel.e;
    while (row <= (entryModel.e / width | 0)) {
      var model = $.extend({}, entryModel);
      model.s = Math.max(s, 0);
      model.e = Math.min(e, width - 1);
      self._rows[row].add(model);
      s -= width;
      e -= width;
      row++;
    }
  };
})(jQuery);
