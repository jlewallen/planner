(function() {

  $.templates({
    plannerMain: "<div class='planner'><div class='planner-main-wrapper'><div class='planner-main'>{{for years tmpl='plannerYear' /}}</div></div></div>",
    plannerYear: "{{for rows tmpl='plannerYearRow' /}}",
    plannerYearRow: "<div class='year-row'><table cellpadding='0' cellspacing='0' class='background'><tr><td></td>{{for periods tmpl='plannerPeriodBackground' /}}</tr></table><table cellpadding='0' cellspacing='0' class='entries'>{{for periods tmpl='plannerPeriodEntries' /}}</table><table cellpadding='0' cellspacing='0' class='labels'><tr><th>{{>title}}</th>{{for periods tmpl='plannerPeriodLabels' /}}</tr></table></div>",
    plannerPeriodBackground: "<td class='{{>classes}}' data-idx='{{>index}}' data-key='{{>key}}'></td>",
    plannerPeriodEntries: "",
    plannerPeriodLabels: "<td class='{{>classes}}'><span>{{>title}}</span></td>",
    plannerEntryCell: "<div data-key='{{>key}}' class='entry' style='border: 0px solid #000; color: {{>text}}; background-color: {{>color}}'><span>{{>title}}</span></div>"
  });

  EntryRow = function(dom) {
    var self = this;
    self._dom = dom;
    self._cells = dom.find(".empty-cell");
    self._occupied = self._cells.map(function(e) {
      return false;
    });
  };

  EntryRow.prototype.available = function(s, e) {
    var self = this;
    for (var i = s; i <= e; ++i) {
      if (self._occupied[i]) {
        return false;
      }
    }
    return true;
  };

  EntryRow.prototype.fill = function(s, e, model) {
    var self = this;
    var cell = $(self._cells[s]);
    cell.html($($.render.plannerEntryCell(model)).data('model', model)).removeClass("empty-cell");
    for (var i = s; i <= e; ++i) {
      if (i != s) {
        $(self._cells[i]).hide();
      }
      self._occupied[i] = true;
    }
    cell.attr("colspan", e - s + 1);
    return cell;
  };

  EntryRowSet = function(dom, width) {
    var self = this;
    self._width = width;
    self._headingWidth = 1;
    self._dom = dom.append("<tr class='fill'><td colspan='" + width + "'></td></tr>");
    self._rows = [];
  };

  EntryRowSet.prototype.findRowFor = function(entryModel) {
    var self = this;
    var available = $.grep(self._rows, function(e) {
      return e.available(entryModel.s, entryModel.e);
    });
    if (available.length == 0) {
      var tr = $("<tr></tr>");
      for (var i = 0; i < self._headingWidth; ++i) {
        tr = tr.append("<td class='empty-heading'></td>");
      }
      for (var i = 0; i < self._width; ++i) {
        tr = tr.append("<td class='empty-cell'></td>");
      }
      tr.insertBefore(self._dom.find(".fill"));
      var row = new EntryRow(tr);
      self._rows.push(row);
      return row;
    }
    return available[0];
  };

  EntryRowSet.prototype.add = function(entryModel) {
    var self = this;
    var row = self.findRowFor(entryModel);
    return row.fill(entryModel.s, entryModel.e, entryModel);
  };

  window.MiniPlanner = function(dom, model) {
    var self = this;
    self._dom = dom;
    self._model = model;
    self._width = 13;
    self._size = 100;
    self._styles = [
      { text: '#ffffff', color: '#5484ed' },
      { text: '#1d1d1d', color: '#a4bdfc' },
      { text: '#1d1d1d', color: '#46d6db' },
      { text: '#1d1d1d', color: '#7ae7bf' },
      { text: '#ffffff', color: '#51b749' },
      { text: '#1d1d1d', color: '#fbd75b' },
      { text: '#1d1d1d', color: '#ffb878' },
      { text: '#1d1d1d', color: '#ff887c' },
      { text: '#1d1d1d', color: '#b3dc6c' },
      { text: '#1d1d1d', color: '#dc2127' },
      { text: '#1d1d1d', color: '#dbadff' },
      { text: '#1d1d1d', color: '#e1e1e1' }
    ];

    self._dom.html($.render.plannerMain(self._model)).find(".planner-main-wrapper").css("height", self._model.years.length * self._size * 2);
    self._dom.find(".year-row").each(function(i, e) {
      $(e).css("top", i * self._size + "px").css("height", self._size + "px");
    });
    self._rows = self._dom.find('table.entries').map(function(i, m) {
      return new EntryRowSet($(m), self._width);
    });
    self.bind();
  }

  window.MiniPlanner.prototype.bind = function() {
    var self = this;
    self._dom.on('mouseenter', '.entry', function(i, e) {
      var key = $(this).data("key");
      var model = $(this).data('model');
      self._dom.find(".hover").removeClass("hover");
      self._dom.find(".entry[data-key='" + key + "']").addClass("hover");
      self._dom.trigger("planner:hover-on", model);
    });
    self._dom.on('mouseleave', '.entry', function(i, e) {
      var model = $(this).data('model');
      self._dom.find(".hover").removeClass("hover");
      self._dom.trigger("planner:hover-off", model);
    });
    self._dom.on('click', '.entry', function(i, e) {
      var key = $(this).data("key");
      var model = $(this).data('model');
      self._dom.find(".selected").removeClass("selected");
      self._dom.find(".entry[data-key='" + key + "']").addClass("selected");
      self._dom.trigger("planner:selected", model);
    });
  }

  window.MiniPlanner.prototype.addEntry = function(entryModel) {
    var self = this;
    var styled = $.extend(entryModel, self._styles[0]);
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
    self._styles.push(self._styles.shift());
  }

  window.MiniPlannerSelectionManager = function(dom, boxes) {
    var self = this;

    function refresh(selection) {
      $(boxes).removeClass('selected');
      if (selection == null)  {
        return;
      }
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
      selected.addClass('selected');
    }

    function boxFor(el) {
      if (el.hasClass('period')) return el;
      //var i = el.parent().find("td").index(el);
      //return $(el.closest(".table-row").find(".box").get(i));
    }

    var selection = null;
    dom.on('mousedown', '.period', function(e) {
      var box = boxFor($(this));
      var idx = parseInt(box.data('idx'));
      selection = {
        startIndex: idx,
        endIndex: idx,
        startBox: box,
        endBox: null
      };
      refresh(selection);
    });
    dom.on('mousemove', '.period', function(e) {
      if (selection != null) {
        var box = boxFor($(this));
        var idx = parseInt(box.data('idx'));
        if (selection.endIndex != idx) {
          selection.endIndex = idx;
          selection.endBox = box;
          refresh(selection);
        }
      }
    });
    dom.on('mouseup', '.period', function(e) {
      if (selection != null) {
        var box = boxFor($(this));
        var idx = parseInt(box.data('idx'));
        selection.endIndex = idx;
        selection.endBox = box;
        refresh(selection);
        if (selection.startIndex > selection.endIndex) {
          selection = {
            startIndex: selection.endIndex,
            endIndex: selection.startIndex,
            startBox: selection.endBox,
            endBox: selection.startBox
          };
        }
        dom.trigger('cw:selected', $.extend(selection, {
          startModel: selection.startBox.data("model"),
          endModel: selection.endBox.data("model")
        }));
        selection = null;
      }
    });
    dom.on('click', '.entry', function(e) {
      e.stopPropagation();
    });
    $('body').live('mouseup', function() {
      selection = null;
      refresh(null);
    });
  }

})(jQuery);
