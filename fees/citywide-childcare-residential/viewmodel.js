// -- updates -- moving newRes -> resGFA

define([
    'knockout',
    'fees/abstract-fee',
    'json!./settings.json',
    './component'
], function(ko, AbstractFee, settings) {
    var CitywideChildCareResidentialFee = function(params) {
        var self = this;
        this.settings = settings;

        AbstractFee.apply(this, [params]);

        this.triggered = ko.computed(function() {
            return (
                    this.netNewUnits() >= this.minNetNewUnits ||
                    this.resGFA() >= this.minResGFA
                );
        }, this);

        this.ready = ko.computed(function() {
            if (!this.triggered()) {
                return true;
            }
            return this.newRes() !== null && this.newRes() !== '' &&
                this.nonResToRes() !== null && this.nonResToRes() !== '' &&
                this.newConstructionCredit() !== null && this.newConstructionCredit() !== '' &&
                this.changeOfUseCredit() !== null && this.changeOfUseCredit() !== '' &&
                this.pdrToRes() !== null && this.pdrToRes() !== '';
        }, this);

        var getFeeRate = function (feeType) {
            var netNewUnits = self.netNewUnits();
            if (netNewUnits <= 9) {
                return self.lessThanOrEqualTo9[feeType];
            }
            return self.greaterThanOrEqualTo10[feeType];
        }
        this.feePerNonResToRes = ko.computed(function () {
            return getFeeRate('feePerNonResToRes');
        }, this);
        this.feePerPDRToRes = ko.computed(function () {
            return getFeeRate('feePerPDRToRes');
        }, this);
        this.feePerNewRes = ko.computed(function () {
            return getFeeRate('feePerNewRes');
        }, this);

        this.newConstructionFee = ko.computed(function() {
            if (!this.triggered()) {
                return 0;
            }
            return this.feePerNewRes() * this.resGFA()
        }, this);

        this.changeOfUseFee = ko.computed(function() {
            if (!this.triggered()) {
                return 0;
            }
            const nonResFee = this.feePerNonResToRes() // NOTE: pdr and nonres are the same atm
            return (this.nonResGFA() || 0) * nonResFee
        }, this);

        this.uncreditedFee = ko.computed(function() {
            return parseFloat(this.newConstructionFee()) + parseFloat(this.changeOfUseFee());
        }, this);

        this.feeCredit = ko.computed(function () {
            // added - calcuilated fee needed this
            // const value = parseFloat(this.newConstructionCredit()) + parseFloat(this.changeOfUseCredit())
            // return isNaN(value) ? 0 : value;
            // return parseFloat(this.newConstructionCredit()) + parseFloat(this.changeOfUseCredit())
            const constructionCredit = parseFloat(this.newConstructionCredit) || 0
            const changeOfUseCredit = parseFloat(this.changeOfUseCredit) || 0
            return constructionCredit + changeOfUseCredit
        }, this);

        this.calculatedFee = ko.computed(function() {
            var feeValue = this.uncreditedFee() - this.feeCredit();
            return feeValue > 0 ? feeValue : 0;
        }, this);

        // -- added --
        this.calculation_newRes = ko.computed(function () {
            return `${this.resGFA() || 0}gsf * ${this.feePerNewRes()}/gsf = ${dollarFormat(this.newConstructionFee())}`
            // return `testing`
        }, this)
        this.calculation_changeOfUse = ko.computed(function () {
            return `${this.nonResGFA() || 0}gsf * ${this.feePerPDRToRes()}/gsf = ${dollarFormat(this.changeOfUseFee())}`
        }, this)
    };

    CitywideChildCareResidentialFee.settings = settings;

    return CitywideChildCareResidentialFee;
});

function dollarFormat(value) {
    // Ensure the value is a number
    const number = parseFloat(value);
    // Check if the number is valid
    if (isNaN(number)) {
        return "$0.00"; // Return a default value if input is invalid
    }
    // Round to two decimal places and format with dollar sign
    return `$${number.toFixed(2)}`;
}

