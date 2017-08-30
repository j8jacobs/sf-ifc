define([
	'knockout',
	'underscore',
	'jquery'
], function(ko, _, $) {
	var App = function(params) {
		var self = this;
		this.name = params.name || "";
		this.state = ko.observable(params.state || 'trigger');
		this.loading = ko.observable(false);
		this.feeViewModels = ko.observableArray();
		this.selectedFee = ko.observable();
		var now = new Date();
		this.reportDate = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();

		this.total = ko.computed(function() {
			var total = 0;
			this.feeViewModels().forEach(function(feeViewModel) {
				if (feeViewModel.triggered()) {
					total += feeViewModel.calculatedFee();
				}
			});
			return total;
		}, this);

		this.triggeredFeeViewModels = ko.computed(function() {
			var feeViewModels = this.feeViewModels();
			return _.filter(feeViewModels, function(feeViewModel) {
				return feeViewModel.triggered();
			});
		}, this);

		this.triggeredFeeViewModels.subscribe(function() {
			var feeViewModels = self.triggeredFeeViewModels();
			self.selectedFee(feeViewModels.length > 0 ? feeViewModels[0] : null)
		});

		this.geometry = ko.observable(params.geometry || null);

		this.newDwellings = ko.observable(params.newDwellings || null);
		this.removedDwellings = ko.observable(params.removedDwellings || null);
        this.newFlrSpace = ko.observable(params.newFlrSpace || null);
        this.removedFlrSpace = ko.observable(params.removedFlrSpace || null);
		this.netNewDwellings = ko.computed(function() {
			var newDwellings = this.newDwellings() || 0;
			var removedDwellings = this.removedDwellings() || 0;
			return newDwellings - removedDwellings;
		}, this);

		this.triggersReady = ko.computed(function() {
			var newDwellings = this.newDwellings();
			var removedDwellings = this.removedDwellings();
            var newFlrSpace = this.newFlrSpace();
			var removedFlrSpace = this.removedFlrSpace();
			return removedDwellings !== null && removedDwellings !== '' &&
				newDwellings !== null && newDwellings !== '' &&
                removedFlrSpace !== null && removedFlrSpace !== '' &&
				newFlrSpace !== null && newFlrSpace !== '' &&
				this.geometry();
		}, this);

		this.feesReady = ko.computed(function() {
			if (!this.triggersReady()) {
				return false;
			}
			var feeViewModels = this.feeViewModels();
			var ready = true;
			feeViewModels.forEach(function(feeViewModel) {
				if (!feeViewModel.ready()) {
					ready = false;
				}
			});
			return ready;
		}, this);

		this.viewTrigger = function() {
			self.state('trigger');
		};

		this.viewCalculate = function() {
			if (self.triggersReady()) {
				self.state('calculate');
			}
		};

		this.viewReport = function() {
			if (self.feesReady()) {
				self.state('report');
			}
		};

		this.queryString = ko.computed(function() {
			var feeViewModelJSON = {};
			_.each(this.feeViewModels(), function(feeViewModel) {
				feeViewModelJSON[feeViewModel.feeTypeName] = feeViewModel.json();
			});
			var appJSON = {
				state: this.state(),
				newDwellings: this.newDwellings(),
				removedDwellings: this.removedDwellings(),
                newFlrSpace: this.newFlrSpace(),
				removedFlrSpace: this.removedFlrSpace(),
				geometry: this.geometry(),
				fees: JSON.stringify(feeViewModelJSON)
			}
			return '?' + $.param(appJSON).split('+').join('%20');
		}, this);

		this.linkURL = ko.computed(function() {
			var queryString = this.queryString();
			return window.location.origin + window.location.pathname + queryString;
		}, this);

		this.copyModBtn = window.navigator.platform === 'MacIntel' ? 'Cmd' : 'Ctrl';
	};

	return App;
});
