(function () {
    /**
     * @param {string} tag
     * @param {{text?: string, className?: string}?} obj
     * @returns {Element}
     */
    function createElement(tag, obj) {
        var element = document.createElement(tag),
            text = obj.text,
            className = obj.className;
        if (text) {
            element.innerText = text;
        }
        if (className) {
            element.className = className;
        }

        return element;
    }

    function CurrencyOfferComponent(cur1, cur2) {
        var dom = CurrencyOfferComponent.template(cur1, cur2),
            numericBuyValue = NaN,
            buyValue = '-',
            sellValue = '-';

        function update(buy, sell) {
            updateDomWith(dom.sell, sell.slice(0, 4), sell.slice(4, 6), sell[6]);
            updateDomWith(dom.buy, buy.slice(0, 4), buy.slice(4, 6), buy[6]);
        }

        function updateDomWith(dom, bottom, middle, top) {
            dom.bottom.textContent = bottom;
            dom.middle.textContent = middle;
            dom.top.textContent = top;
        }

        function updateIndicator(isBuy) {
            let classList = dom.component.classList;
            classList.remove('plus', 'minus');
            classList.add(isBuy ? 'plus' : 'minus');
        }

        this.setBuyValue = function (value) {
            buyValue = String(value);
            update(buyValue, sellValue);
            if (!isNaN(numericBuyValue)) {
                updateIndicator(numericBuyValue < +value);
            }
            numericBuyValue = +value;
            return this;
        };

        this.setSellValue = function (value) {
            sellValue = String(value);
            update(buyValue, sellValue);
            return this;
        };

        this.appendTo = function (element) {
            element.appendChild(dom.component);
            return this;
        };
    }

    CurrencyOfferComponent.priceTemplate = function (dom) {
        var priceContainer = createElement('div', {className: 'price-container'}),
            smallNumber = createElement('span', {className: 'bottom fs-regular'}),
            mediumNumber = createElement('span', {className: 'middle fs-huge bold lh-fix'}),
            bigNumber = createElement('span', {className: 'top fs-regular'});

        dom.bottom = smallNumber;
        dom.middle = mediumNumber;
        dom.top = bigNumber;

        priceContainer.appendChild(smallNumber);
        priceContainer.appendChild(mediumNumber);
        priceContainer.appendChild(bigNumber);

        return priceContainer;
    };

    CurrencyOfferComponent.offerTemplate = function (dom, currency, className) {
        var offer = createElement('div', {className: 'single-offer offer-colors ' + className}),
            offerName = createElement('div', {className: 'offer-name', text: currency}),
            dataContainer = createElement('div', {className: 'data-container'}),
            arrowTip = createElement('div', {className: 'arrow-tip offer-colors'}),
            price = CurrencyOfferComponent.priceTemplate(dom);

        dataContainer.appendChild(offerName);
        dataContainer.appendChild(price);
        offer.appendChild(dataContainer);
        // arrowContainer.appendChild(arrowTip);
        offer.appendChild(arrowTip);

        return offer;
    };

    CurrencyOfferComponent.template = function (cur1, cur2) {
        var dom = {
                buy: {},
                sell: {}
            },
            container = createElement('div', {className: 'currency-offers-component'}),
            nameContainer = createElement('div', {text: cur1 + ' ' + cur2, className: 'instrument-name bold'}),
            offersContainer = createElement('div', {className: 'offers'}),
            profitArrow = createElement('div', {className: 'profit-arrow'}),
            sell_leftOffer = CurrencyOfferComponent.offerTemplate(dom.sell, 'Sell ' + cur1, 'sell fs-tiny'),
            buy_rightOffer = CurrencyOfferComponent.offerTemplate(dom.buy, 'Buy ' + cur1, 'buy fs-tiny');

        container.appendChild(nameContainer);
        container.appendChild(offersContainer);
        offersContainer.appendChild(sell_leftOffer);
        offersContainer.appendChild(profitArrow);
        offersContainer.appendChild(buy_rightOffer);

        dom.name = nameContainer;
        dom.component = container;
        dom.profit = profitArrow;

        return dom;
    };

    CurrencyOfferComponent.jsonDataCreationAdapter = function (data) {
        var currencyList = data.pair.split(' '),
            cur1 = currencyList[0],
            cur2 = currencyList[1];
        return new CurrencyOfferComponent(cur1, cur2)
            .setBuyValue(data.buy)
            .setSellValue(data.sell);
    };

    var DirMap = {
        BUY: 0,
        SELL: 1
    };

    function startHarassing(pairList) {
        console.warn('startHarassing', pairList);

        setInterval((function (list) {
            let component,
                newDataToSet;
            list.forEach((pair) => {
                component = pair.getComponent();
                newDataToSet = pair.getNewData();

                if (newDataToSet[0] === DirMap.BUY) {
                    component.setBuyValue(newDataToSet[1]);
                } else {
                    component.setSellValue(newDataToSet[1]);
                }
            });
        }).bind(window, pairList), 1000);
    }

    function ComponentDataPair(component, data) {
        var dataFn = ComponentDataPair.createNewDataFunction(data.buy, data.sell);

        this.getComponent = function () {
            return component;
        };

        this.getData = function () {
            return data;
        };

        this.getNewData = function () {
            return dataFn();
        };
    }

    ComponentDataPair.createNewDataFunction = function (originalBuy, originalSell) {
        var buyLimitVar = originalBuy * 0.1,
            buyBaseValue = originalBuy - buyLimitVar,
            sellLimitVar = originalSell * 0.1,
            sellBaseValue = originalSell - sellLimitVar;

        return function () {
            var isBuy = (Math.random() > 0.5),
                dir, baseValue, baseLimit;
            if (isBuy) {
                dir = DirMap.BUY;
                baseValue = buyBaseValue;
                baseLimit = buyLimitVar;
            } else {
                dir = DirMap.SELL;
                baseValue = sellBaseValue;
                baseLimit = sellLimitVar;
            }

            return [dir, baseValue + (baseLimit * Math.random())];
        }
    };

    fetch('data.json')
        .then(function (response) {
            console.warn('fetch: data', response);
            return response.json();
        })
        .then(function (jsonData) {
            var fragment = document.createDocumentFragment(),
                componentDataPairList = [];
            jsonData.forEach(function (record) {
                componentDataPairList.push(
                    new ComponentDataPair(CurrencyOfferComponent.jsonDataCreationAdapter(record).appendTo(fragment), record)
                );
            });

            document.body.appendChild(fragment);

            return componentDataPairList;
        })
        .then(startHarassing)
        .catch(function (error) {
            alert('Could not start:', error.toString());
            console.warn('fetch: error', error);
        });
})();


