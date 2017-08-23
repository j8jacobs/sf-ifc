define([
	'knockout',
	'fees/abstract-fee',
	'json!fees/mock-fee/settings.json',
	'fees/mock-fee/component'
], function (ko, AbstractFee, settings) {
    var MockFee = function(params) {
        AbstractFee.apply(this, [params]);
		this.feeTypeName = MockFee.feeTypeName;
		this.label = 'Mock Fee';
		this.requiresInput = true;
		this.value = ko.observable(params.value || null);
		this.multiplier = settings.multiplier;
		
		this.triggered = ko.computed(function () {
			return this.app.netNewDwellings() >= settings.minNetNewDwellings;
		}, this);
		
		this.ready = ko.computed(function () {
			if (!this.triggered()) {
				return true;
			}
			return this.value();
		}, this);
		
		this.calculatedFee = ko.computed(function () {
			var val = this.value();
			return val ? val*this.multiplier : 0;
		}, this);
		
		this.json = ko.computed(function () {
			return {
				"value": this.value()
			};
		}, this);
    };
	
	MockFee.feeTypeName = 'mock-fee';

    return MockFee;
});