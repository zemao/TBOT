"use strict";

(function() {
    //This handles events
    const profileManager = require("../../backend/common/profile-manager.js");
    const { ipcRenderer } = require("electron");

    angular.module("twitcherbotApp").factory("currencyService", function(logger, utilityService,
        backendCommunicator) {
        let service = {};

        // The currency settings.
        let currencyDb = profileManager.getJsonDbInProfile("/currency/currency");

        // This will get currency information.
        // Can pass option param to just get one currency, otherwise it gets all of them.
        service.getCurrencies = function(currencyId) {

            // If we have an optional param return settings for that currency.
            if (currencyId != null) {
                try {
                    return currencyDb.getData("/" + currencyId);
                } catch (err) {
                    logger.error(err);
                    return [];
                }
            }

            let currencyData;
            try {
                currencyData = currencyDb.getData("/");
            } catch (err) {
                logger.error(err);
                return [];
            }

            return Object.values(currencyData);
        };

        service.getCurrency = (currencyId) => {
            return service.getCurrencies().find(c => c.id === currencyId);
        };

        // Saved the currency modal.
        service.saveCurrency = function(currency, updateName = false) {
            let currencyId = currency.id,
                allCurrencies = service.getCurrencies();

            // Check to make sure we don't have a currency with the same name.
            if (updateName) {
                let hasDuplicate;
                let counter = 1;
                let name = currency.name;
                do {
                    hasDuplicate = Object.values(allCurrencies)
                        .some(c => c.name === name);
                    if (hasDuplicate) {
                        name = currency.name + counter;
                        counter++;
                    }
                } while (hasDuplicate);
                currency.name = name;
            } else {
                const dupe = Object.values(allCurrencies)
                    .some(c => c.name === name);
                // Uh Oh! We have a currency with this name already.
                if (dupe) {
                    utilityService.showErrorModal(
                        "You cannot create a currency with the same name as another currency!"
                    );
                    logger.error('User tried to create currency with the same name as another currency: ' + currency.name + '.');
                    return;
                }
            }

            // Push Currency to DB.
            currencyDb.push("/" + currencyId, currency);

            // Log currency name.
            logger.debug('Currency created with name: ' + currency.name);

            // Send success message.
            ipcRenderer.send("createCurrency", currencyId);
            ipcRenderer.send("refreshCurrencyCache");
            ipcRenderer.send("refreshCurrencyCommands", {"action": "create", "currency": currency});
        };

        // Updated a pre-existing currency through the modal.
        service.updateCurrency = function(currency) {
            let currencyId = currency.id;
            currencyDb.push("/" + currencyId, currency);
            ipcRenderer.send("refreshCurrencyCache");
            ipcRenderer.send("refreshCurrencyCommands", {"action": "update", "currency": currency});
        };

        // Purged a currency through the modal.
        service.purgeCurrency = function(currencyId) {
            ipcRenderer.send("purgeCurrency", currencyId);
        };

        // Deleted a currency through the modal.
        service.deleteCurrency = function(currency) {
            let currencyId = currency.id;
            currencyDb.delete("/" + currencyId);
            ipcRenderer.send("deleteCurrency", currencyId);
            ipcRenderer.send("refreshCurrencyCache");
            ipcRenderer.send("refreshCurrencyCommands", {"action": "delete", "currency": currency});
        };

        backendCommunicator.on("import-currency", currency => {
            if (currency == null || currency.id == null) return;
            if (service.getCurrency(currency.id)) {
                service.updateCurrency(currency);
            } else {
                service.saveCurrency(currency, true);
            }
        });

        backendCommunicator.on("remove-currency", currency => {
            service.deleteCurrency(currency);
        });

        return service;
    });
}());
