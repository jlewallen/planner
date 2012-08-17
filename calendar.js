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

  window.CalendarWidget = function(dom, width, model) {
    var self = this;
    var size = 140;
    var columns = $.map(model.rows, function(r) { return r.columns; });

    self._dom = dom;
    self._width = width;
    self._model = model;
    self._blank = $($.render.calendarWidgetMain(model));
    self._blank.find(".table-row").each(function(i, e) {
      $(e).css("top", i * size + "px").css("height", size + "px");
    });
    self._boxes = self._blank.find(".box");
    self._boxes.each(function(i, e) {
      $(e).data("idx", i.toString()).data("model", columns[i]);
    });
    self._dom.html(self._blank).css("height", model.rows.length * size);
    self._rows = dom.find('.table-grid tbody').map(function(i, m) {
      return new EntryRowSet($(m), null, null);
    });
    new CalendarSelectionManager(dom, self._boxes);
  };

  window.CalendarWidget.prototype.add = function(entryModel) {
    var self = this;
    var row = (entryModel.s / self._width) | 0;
    var s = entryModel.s - row * self._width;
    var e = entryModel.e - row * self._width;
    while (row <= (entryModel.e / self._width | 0)) {
      var model = $.extend({}, entryModel);
      model.s = Math.max(s, 0);
      model.e = Math.min(e, self._width - 1);
      self._rows[row].add(model);
      s -= self._width;
      e -= self._width;
      row++;
    }
  };

  window.CalendarSelectionManager = function(dom, boxes) {
    var self = this;

    function refresh(selection) {
      var selected = $();
      var s = selection.startIndex;
      var e = selection.endIndex;
      if (s > e) {
        s = selection.endIndex;
        e = selection.startIndex;
      }
      for (var i = s; i <= e; ++i) {
        selected = selected.add(boxes[i]);
      }
      $(boxes).removeClass('selected');
      selected.addClass('selected');
    }

    var selection = null;
    dom.on('mousedown', '.box', function(e) {
      var idx = parseInt($(this).data('idx'));
      selection = {
        startIndex: idx,
        endIndex: idx,
        startBox: $(this),
        endBox: null
      };
      refresh(selection);
    });
    dom.on('mousemove', '.box', function(e) {
      if (selection != null) {
        var idx = parseInt($(this).data('idx'));
        if (selection.endIndex != idx) {
          selection.endIndex = idx;
          selection.endBox = $(this);
          refresh(selection);
        }
      }
    });
    dom.on('mouseup', '.box', function(e) {
      if (selection != null) {
        var idx = parseInt($(this).data('idx'));
        selection.endIndex = idx;
        selection.endBox = $(this);
        refresh(selection);
        dom.trigger('cw:selected', $.extend(selection, {
          startModel: selection.startBox.data("model"),
          endModel: selection.endBox.data("model")
        }));
        selection = null;
      }
    });
  }
})(jQuery);
