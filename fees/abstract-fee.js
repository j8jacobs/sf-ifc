define([
	'knockout'
], function(ko) {
	var AbstractFee = function(params) {
        // the app viewmodel (will be passed in by app)
		this.app = params.app || null;

        // the string label to use in the UI for this fee type
		this.label = "";

        // fee type name (should match folder name)
        // ensure this is applied to both the prototype and instances
		this.feeTypeName = AbstractFee.feeTypeName;

        // indicates if this fee has been triggered
        // override with fee type specific triggering logic
		this.triggered = ko.computed(function() {
			return false;
		}, this);

        // indicates if this fee is ready for calculation
        // override with fee type specific logic
		this.ready = ko.computed(function() {
			return true
		}, this);

        // returns the calculated fee value
        // override with fee type specific calculation logic
		this.calculatedFee = ko.computed(function() {
			return 0;
		}, this);

        // returns the json object needed to restore the state of this viewmodel
        // this value is automatically stored in the querystring
        // override with fee type specific logic
		this.json = ko.computed(function() {
			return {};
		}, this);

        // fee subtotal for use in reports;
        // this should not need to be overridden in fee types
        this.subtotal = ko.computed(function () {
            var subtotal = 0;
            var feeViewModels = this.app.feeViewModels();
            for (var i = 0; i < feeViewModels.length; i++) {
                subtotal += feeViewModels[i].calculatedFee();
                if (this === feeViewModels[i]) {
                    break;
                }
            }
            return subtotal;
        }, this);
	};

    // feeTypeName should be the same on both prototype and instances
    // (see above)
	AbstractFee.feeTypeName = "";

	return AbstractFee;
});
