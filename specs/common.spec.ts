/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

import "jasmine-jquery";

import powerbi from "powerbi-visuals-api";

import {
    select as d3Select,
    Selection as ID3Selection,
 } from "d3-selection";

import {
    MockISelectionIdBuilder,
    testDom,
} from "powerbi-visuals-utils-testutils";

import {
    IKPIIndicatorSettings,
    KPIIndicatorSettings,
} from "../src/settings/descriptors/kpi/kpiIndicatorSettings";

import { ColumnBasedModelConverter } from "../src/converter/data/columnBasedModel/columnBasedModelConverter";
import { RowBasedModelConverter } from "../src/converter/data/rowBasedModel/rowBasedModelConverter";

import { ModalWindowService } from "../src/services/modalWindowService";
import { ScaleService } from "../src/services/scaleService";
import { SettingsState } from "../src/services/state/settingsState";

import { IDataRepresentationSeries } from "../src/converter/data/dataRepresentation/dataRepresentationSeries";
import { IDataRepresentationSeriesSet } from "../src/converter/data/dataRepresentation/dataRepresentationSeriesSet";

import { Settings } from "../src/settings/settings";

import { LazyComponent } from "../src/visualComponent/lazyComponent";
import { IVisualComponent } from "../src/visualComponent/visualComponent";

import { ColumnBasedDataBuilder } from "./columnBasedDataBuilder";
import { DataBuilder } from "./dataBuilder";
import { TestWrapper } from "./testWrapper";
import { VisualBuilder } from "./visualBuilder";

describe("Power KPI Matrix", () => {
    describe("static", () => {
        describe("capabilities", () => {
            it("the capabilities should not be empty", () => {
                expect(require("../capabilities.json")).not.toBeEmpty();
            });
        });
    });

    describe("DOM", () => {
        let testWrapper: TestWrapper;

        beforeEach(() => {
            testWrapper = TestWrapper.createWithColumnBasedData();
        });

        it("root element should be defined in DOM", (done) => {
            testWrapper.visualBuilder.updateRenderTimeout(testWrapper.dataView, () => {
                expect(testWrapper.visualBuilder.$root).toBeInDOM();

                done();
            });
        });

        it("visual should render cells", (done) => {
            testWrapper.visualBuilder.updateRenderTimeout(testWrapper.dataView, () => {
                expect(testWrapper.visualBuilder.$cells).toBeInDOM();

                done();
            });
        });
    });

    describe("KPIIndicatorSettings", () => {
        let kpiIndicatorSettings: KPIIndicatorSettings;

        beforeEach(() => {
            kpiIndicatorSettings = new KPIIndicatorSettings();
            kpiIndicatorSettings.applySettingToContext();
        });

        describe("getElementByIndex", () => {
            const testSet: string[] = [
                "Power KPI Matrix 1",
                "Power KPI Matrix 2",
                "Power KPI Matrix 3",
                "Power KPI Matrix 4",
                "Power KPI Matrix 5",
            ];

            it("should return the first element", () => {
                const expectedValue: string = testSet[0];
                const actualValue: string = kpiIndicatorSettings.getElementByIndex(testSet, 0);

                expect(actualValue).toBe(expectedValue);
            });

            it("should return the last element", () => {
                const expectedValue: string = testSet[testSet.length - 1];
                const actualValue: string = kpiIndicatorSettings.getElementByIndex(testSet, testSet.length - 1);

                expect(actualValue).toBe(expectedValue);
            });
        });

        describe("getCurrentKPI", () => {
            it("should return the default KPI if KPI value has not been found in the specified KPIs", () => {
                const actualKPI: IKPIIndicatorSettings = kpiIndicatorSettings.getCurrentKPI(-100);

                expect(actualKPI.shape).toBeNull();
                expect(actualKPI.color).toBeNull();
            });

            it("should return KPI if KPI value has been found in the specified KPIs", () => {
                const actualKPI: IKPIIndicatorSettings = kpiIndicatorSettings.getCurrentKPI(2);

                expect(actualKPI.shape).toBeDefined();
                expect(actualKPI.color).toBeDefined();
            });
        });
    });

    describe("Data Converter", () => {
        describe("Column-based data", () => {
            let converter: ColumnBasedModelConverter;

            beforeEach(() => {
                converter = new ColumnBasedModelConverter(() => {
                    return new MockISelectionIdBuilder();
                });
            });

            it("should not throw exceptions if dataView is undefined", () => {
                expect(() => {
                    converter.convert({
                        columnMapping: undefined,
                        dataView: undefined,
                        settings: undefined,
                        settingsState: new SettingsState(),
                        viewMode: powerbi.ViewMode.Edit,
                        viewport: undefined,
                    });
                }).not.toThrow();
            });
        });

        describe("Row-based data", () => {
            let converter: RowBasedModelConverter;

            beforeEach(() => {
                converter = new RowBasedModelConverter(() => {
                    return new MockISelectionIdBuilder();
                });
            });

            it("should not throw exceptions if dataView is undefined", () => {
                expect(() => {
                    converter.convert({
                        columnMapping: undefined,
                        dataView: undefined,
                        settings: undefined,
                        settingsState: new SettingsState(),
                        viewMode: powerbi.ViewMode.Edit,
                        viewport: undefined,
                    });
                }).not.toThrow();
            });

            describe("deepSearchSeries", () => {
                it("should find nodes properly if there're duplicates on the same level", () => {
                    const powebiTest: IDataRepresentationSeries = {
                        axisValue: undefined,
                        axisValues: undefined,
                        children: undefined,
                        childrenSet: {},
                        level: 1,
                        name: "powebiTest",
                    };

                    const powebiTest1: IDataRepresentationSeries = {
                        axisValue: undefined,
                        axisValues: undefined,
                        children: undefined,
                        childrenSet: {},
                        level: 1,
                        name: "powebiTest1",
                    };

                    const seriesSet: IDataRepresentationSeriesSet = {
                        test: {
                            axisValue: undefined,
                            axisValues: undefined,
                            children: undefined,
                            childrenSet: {
                                powerbi: powebiTest,
                            },
                            level: 0,
                            name: "test",
                        },
                        test1: {
                            axisValue: undefined,
                            axisValues: undefined,
                            children: undefined,
                            childrenSet: {
                                powerbi: powebiTest1,
                            },
                            level: 0,
                            name: "test1",
                        },
                    };

                    expect(converter.deepSearchSeries(seriesSet, ["test", "powerbi"])).toBe(powebiTest);
                });

                it("should return null if seriesSet is not defined", () => {
                    expect(converter.deepSearchSeries(null, [])).toBeNull();
                });

                it("should return null if seriesSet does not contain a required series", () => {
                    const seriesSet: IDataRepresentationSeriesSet = {
                        test: {
                            axisValue: undefined,
                            axisValues: undefined,
                            children: undefined,
                            childrenSet: {
                                powerbi: {
                                    axisValue: undefined,
                                    axisValues: undefined,
                                    children: undefined,
                                    childrenSet: {},
                                    level: 1,
                                    name: "powebiTest",
                                },
                            },
                            level: 0,
                            name: "test",
                        },
                    };

                    expect(converter.deepSearchSeries(seriesSet, ["pbi", "desktop"])).toBeNull();
                });
            });
        });
    });

    describe("ScaleService", () => {
        let scaleService: ScaleService;

        beforeEach(() => {
            scaleService = new ScaleService();
        });

        it("should return viewport without any scale if element isn't specified", () => {
            const scale: powerbi.IViewport = scaleService.getScale();

            expect(scale.width).toBe(1);
            expect(scale.height).toBe(1);
        });

        it("should return viewport without any scale if element doesn't have `scale` style", () => {
            scaleService.element = testDom("100px", "100px").get(0);

            const scale: powerbi.IViewport = scaleService.getScale();

            expect(scale.width).toBeGreaterThan(0);
            expect(scale.height).toBeGreaterThan(0);
        });

        afterEach(() => {
            scaleService.destroy();
        });
    });

    describe("components", () => {
        describe("ModalWindowService", () => {
            let modalWindowService: ModalWindowService;
            let settings: Settings;

            beforeEach(() => {
                modalWindowService = new ModalWindowService({
                    componentCreators: [],
                    element: getTestDOMElement(),
                });

                settings = Settings.getDefault() as Settings;
            });

            it("should change background color to black", () => {
                const color: string = "black";

                settings.popOutGeneralSettings.backgroundColor = color;

                spyOn(modalWindowService as any, "updateBackgroundColor");

                modalWindowService.render({
                    settings,
                    viewport: {
                        height: 300,
                        width: 300,
                    },
                });

                expect((modalWindowService as any).updateBackgroundColor).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    color,
                );
            });

            it("should be hidden if pop-out is turned off at Format Panel", () => {
                settings.popOutGeneralSettings.show = false;

                modalWindowService.render({
                    settings,
                    viewport: {
                        height: 300,
                        width: 300,
                    },
                });

                expect(modalWindowService.isShown).toBeFalsy();
            });

            it("should be visible if pop-out is turned on at Format Panel", () => {
                settings.popOutGeneralSettings.show = true;

                modalWindowService.render({
                    settings,
                    viewport: {
                        height: 300,
                        width: 300,
                    },
                });

                expect(modalWindowService.isShown).toBeTruthy();
            });
        });

        describe("LazyComponent", () => {
            class LazyTestVisualComponent extends LazyComponent {
                public createInstance() {
                    return {
                        clear: () => {
                            // Mock
                        },
                        destroy: () => {
                            // Mock
                        },
                        render: () => {
                            // Mock
                        },
                    } as IVisualComponent;
                }
            }

            it("TestVisualComponent should not be created", () => {
                const lazyTestVisualComponent: LazyTestVisualComponent = new LazyTestVisualComponent(null);

                spyOn(lazyTestVisualComponent, "createInstance").and.callThrough();

                expect(lazyTestVisualComponent.createInstance).not.toHaveBeenCalled();
            });

            it("TestVisualComponent should be created if render method is called", () => {
                const lazyTestVisualComponent: LazyTestVisualComponent = new LazyTestVisualComponent(null);

                spyOn(lazyTestVisualComponent, "createInstance").and.callThrough();

                lazyTestVisualComponent.render(null);

                expect(lazyTestVisualComponent.createInstance).toHaveBeenCalled();
            });
        });
    });
});

function getTestDOMElement(): ID3Selection<any, any, any, any> {
    return d3Select(testDom("1024", "1280").get(0));
}
