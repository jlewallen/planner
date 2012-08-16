(function() {
  function createPeriod(day, period) {
    var starting = day;
    var ending = day.clone().add(period);
    var todays = Date.today().between(starting.toDate(), ending.toDate());
    var classes = todays ? "period todays" : "period";
    return {
      title: day.format('MMM D'),
      key: day.format('YYYY/MM/DD'),
      starting: starting,
      ending: ending,
      todays: todays,
      classes: classes,
      dom : null,
      spans: []
    };
  };

  function createYears(starting, ending, period) {
    var data = {
      years: [],
      periodsByKey: {},
      periods: []
    };

    var yearModel = null;
    var day = moment(starting);
    while (day.toDate().isBefore(ending)) {
      if (yearModel == null || yearModel.year != day.year()) {
        yearModel = {
          title: day.year(),
          year: day.year(),
          date: day.toDate(),
          map: {},
          periods: []
        };
        data.years.push(yearModel);
      }
      var periodModel = createPeriod(day, period);
      yearModel.periods.push(periodModel);
      yearModel.map[periodModel.key] = periodModel;
      data.periodsByKey[periodModel.key] = periodModel;
      data.periods.push(periodModel);
      day = moment(day).add(period);
    }

    return data;
  };



  window.Model = function(starting, ending, period) {
    $.extend(this, createYears(starting, ending, period));
  };

  window.Model.prototype.findByKey = function(key) {
    return this.periodsByKey[key];
  };

  window.Model.prototype.between = function(starting, ending) {
    if (typeof starting == 'string') starting = this.findByKey(starting);
    if (typeof ending == 'string') ending = this.findByKey(ending);
    var startingDate = starting.starting.toDate();
    var endingDate = ending.starting.toDate();
    if (startingDate.isAfter(endingDate)) {
      startingDate = ending.starting.toDate();
      endingDate = starting.starting.toDate();
    }
    var periods = [];
    $.each(this.periods, function(i, p) {
      if (p.starting.toDate().between(startingDate, endingDate)) {
        periods.push(p);
      }
    });
    return periods;
  };



  window.SelectionManager = function(planner, dom, model) {
    var self = this;
    self._planner = planner;
    self._dom = dom;
    self._model = model;
    self._selection = null;

    self._dom.on('mousedown', '.period', function(e) {
      e.stopPropagation();
      self._selection = new Selection($(this).data("key"), model, self._planner);
      self._popup.css("top", e.pageY + 5).css("left", e.pageX + 5).show();
    });
    
    self._dom.on('mousemove', '.period', function(e) {
      if (self._selection != null) {
        self._selection.move($(this).data("key"));
      }
    });
    
    self._dom.on('mouseup', '.period', function(e) {
      if (self._selection != null) {
        self._selection.stop($(this).data("key"));
        self._selection = null;
        e.stopPropagation();
      }
    });
    
    $('body').live('mousedown', function(e) {
      self._popup.hide();
    });

    $('body').live('mouseup', function(e) {
      if (self._selection != null) {
        self._selection.stop(null);
        self._selection = null;
      }
    });

    self._popup = $('<div class="popup"></div>').hide();
    $('body').append(self._popup);

    self._dom.on('jacob:selected-changed', function(e, model) {
      console.log(model);
      var popupModel = {
        periods: model.selected.length,
        weeks: -model.startPeriod.starting.diff(model.endPeriod.ending, 'weeks')
      };
      self._popup.html($.render.plannerPopup(popupModel));
    });
  };



  window.Selection = function(starting, model, planner) {
    var self = this;
    self._starting = starting;
    self._model = model;
    self._planner = planner;
    return self;
  };

  window.Selection.prototype.update = function() {
    var self = this;
    var startPeriod = self._model.findByKey(self._starting);
    var endPeriod = self._model.findByKey(self._ending);
    var all = self._model.between(startPeriod, endPeriod);

    self._planner._dom.trigger('jacob:selected-changed', {
      startKey: self._starting,
      endKey: self._ending,
      startPeriod: startPeriod,
      endPeriod: endPeriod,
      selected: all
    });

    self._planner.selectAll(all);
  };

  window.Selection.prototype.move = function(ending) {
    var self = this;
    if (self._ending != ending) {
      self._ending = ending;
      self.update();
    }
  };

  window.Selection.prototype.stop = function(ending) {
    var self = this;
    if (ending != null) {
      self._ending = ending;
    }
    self.update();
  };



  window.Planner = function(dom) {
    var self = this;
    self._dom = dom;
    self._starting = Date.parse('1/7/2011');
    self._ending = Date.parse('1/1/2015');
    self._period = { days: 14 };
    self._spans = [];

    $.templates({
      plannerMain: "{{for years tmpl='plannerYear' /}}",
      plannerYear: "<div class='year'><h3 class='title'>{{>title}}</h3><div class='periods'> {{for periods tmpl='plannerPeriod' /}} </div></div>",
      plannerPeriod: "<div class='{{>classes}}' data-key='{{>key}}'><div class='title'>{{>title}}</div></div>",
      plannerSpan: "<div class='entry'><div class='title'>{{>title}}</div></div>",
      plannerPopup: "<div>Periods: {{>periods}}<br/>Weeks: {{>weeks}}</div>"
    });

    self._model = new Model(this._starting, this._ending, this._period);
    self._selectionManager = new SelectionManager(self, self._dom, self._model);

    self.render();
    self.addSpan({ startKey: '2011/01/21', endKey: '2011/04/01', title: 'A' });
    self.addSpan({ startKey: '2011/02/04', endKey: '2011/03/04', title: 'B' });
    self.addSpan({ startKey: '2011/05/13', endKey: '2011/05/13', title: 'C' });
    self.addSpan({ startKey: '2011/05/13', endKey: '2011/05/13', title: 'D' });
    self.addSpan({ startKey: '2011/07/22', endKey: '2011/09/16', title: 'E' });
    self.addSpan({ startKey: '2011/12/09', endKey: '2012/01/20', title: 'F' });

    function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};
    on_resize(function() {
      self.renderAllSpans();
    });
  };

  window.Planner.prototype.render = function() {
    var self = this;
    self._dom.html($.render.plannerMain(self._model));
    self._dom.find('.period').each(function(i, periodDom) {
      self._model.findByKey($(periodDom).data("key")).dom = $(periodDom);
    });
  };

  window.Planner.prototype.renderAllSpans = function() {
    var self = this;
    self._dom.find(".entry").remove();
    $.each(self._spans, function(i, spanModel) {
      self.addSpan(spanModel);
    });
  };

  window.Planner.prototype.renderSpan = function(spanModel) {
    var self = this;
    var all = self._model.between(spanModel.startKey, spanModel.endKey);
    var spans = $();
    var div = null;
    var previous = null;
    var borderWidth = 2;
    var topOffset = 0;

    $.each(all, function(i, p) {
      if (!$.inArray(spanModel, p.spans)) {
        p.spans.push(spanModel);
      }

      var position = p.dom.position();
      if (div == null || (previous != null && (position.left < previous.left || position.left - previous.left > p.dom.width() + 10))) {
        topOffset = 19;
        div = $($.render.plannerSpan(spanModel)).css("position", "absolute");
        div.css("left", position.left);
        previous = position;
        spans = spans.add(div);
      }

      var newOffset = 0 + (p.spans.length * 22);
      if (newOffset > topOffset) {
        topOffset = newOffset;
      }
      div.css("width", ((previous != null ? (position.left - previous.left) : 0)) + p.dom.width() + borderWidth);
      div.css("top", position.top + topOffset);
      previous = position;
    });
    
    self._dom.append(spans);
  };

  window.Planner.prototype.addSpan = function(spanModel) {
    var self = this;
    self.renderSpan(spanModel);
    self._spans.push(spanModel);
  };

  window.Planner.prototype.selectAll = function(periods) {
    var self = this;
    self._dom.find(".period.selected").removeClass("selected");
    $.each(periods, function(i, p) {
      p.dom.addClass("selected");
    });
  };
})();
