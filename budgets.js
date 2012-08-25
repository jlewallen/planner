(function($) {
  $.views.helpers({
    formatCurrency: function(value) {
      value = isNaN(value) || value === '' || value === null ? 0.00 : value;
      return '$' + parseFloat(value).toFixed(2);
    },
    summarizeSchedule: function(value, schedule) {
      if (schedule.basis) {
        return this.ctx.formatCurrency(value) + " " + schedule.basis;
      }
      return this.ctx.formatCurrency(value) + " " + schedule.starting;
    },
  });

  $.templates({
    budgetEditorRow: "<tr data-name='{{>name}}'>" +
                       "<td>{{>name}}</td>" + 
                       "<td>{{>~summarizeSchedule(value, schedule)}}</td>" + 
                       "<td><a href='javascript:void(0)' class='row-remove'>X</a></td>" + 
                     "</tr>",
    budgetEditor: "<div class='editor'>" + 
                  "<form class='form-horizontal master'>" + 
                    "<div class='control-group'><label class='control-label'>Name</label><div class='controls'><input type='text' name='name' value='{{>name}}' class='required' /></div></div>" +
                    "<div class='control-group'><label class='control-label'>Starts</label><div class='controls'><input type='text' name='starting' class='date-field required' value='{{>starting}}' /></div></div>" +
                    "<div class='control-group'><label class='control-label'>Ends</label><div class='controls'><input type='text' name='ending' class='date-field required' value='{{>ending}}' /></div></div>" +
                    "<div class='control-group'>" +
                    "<table class='table table-condensed detail'>" +
                      "<tr><th>Name</th><th>Amount</th><th></th></tr>" +
                      "{{for rows tmpl='budgetEditorRow' /}}" +
                    "</table>" +
                    "</div>" +
                  "</form>" + 
                  "<form class='form-inline detail'>" + 
                    "<input type='text' name='name' placeholder='Name' class='required' /> " +
                    "<input type='text' name='value' placeholder='Value' class='required span1'> " +
                    "<select name='schedule[basis]' class='span2'><option value='yearly'>yearly</option><option value='monthly'>monthly</option><option value='biweekly'>biweekly</option><option value='arbitrary'>arbitrary</option></select> " +
                    "<button class='btn row-add'>Add</button>" +
                  "</form>" +
                  "</div>"
  });

  window.BudgetEditorController = function(dom, model) {
    var self = this;

    self._dom = dom;
    self._model = model;
    self._dom.html($.render.budgetEditor(self._model)).find('.date-field').datepicker({ changeYear: true, changeMonth: true, numberOfMonths: [1, 2], stepMonths: 2, showButtonPanel: false }).end();
    self._dom.on('click', '.row-add', function(e) {
      e.preventDefault();
      if (self._dom.find("form.detail").validate({ errorPlacement: function() { } }).form()) {
        var row = $(this).parents("form").toJSON();
        self._dom.find("table.detail").append($.render.budgetEditorRow(row));
        self._model.rows.push(row);
      }
    });
    self._dom.on('click', '.row-remove', function(e) {
      e.preventDefault();
      var row = $(this).parents("[data-name]");
      var name = row.data("name");
      self._model.rows = $.grep(self._model.rows, function(r) { return r.name != name; });
      row.remove();
    });
  }

  window.BudgetEditorController.prototype.getModel = function() {
    var self = this;
    $.extend(self._model, self._dom.find('form.master').toJSON());
    return self._model;
  }

  window.BudgetEditorController.prototype.showModal = function() {
    var self = this;
    self._dialog = self._dom.dialog({
      title: 'Budget',
      width: '550px',
      modal: true,
      resizeable: true,
      buttons: {
        Cancel: function() {
          self._dialog.dialog('destroy');
        },
        Ok: function() {
          var validation = {
            rules: {
              name: { required: true },
              starting: { required: true, date: true },
              ending: { required: true, date: true }
            }
          };
          if (self._dom.find("form.master").validate(validation).form()) {
            self._dom.trigger('budget:added', self.getModel());
            self._dialog.dialog('destroy');
          }
        }
      }
    });
  }
})(jQuery);

