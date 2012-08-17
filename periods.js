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

  window.Periods = {};
  window.Periods.createYears = createYears;

})();
