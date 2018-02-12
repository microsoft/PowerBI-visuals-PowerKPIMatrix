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
/// <reference path="_references.ts"/>

namespace powerbi.extensibility.visual.test {
    // powerbi
    import DataView = powerbi.DataView;
    import IViewport = powerbi.IViewport;
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;

    // PowerKPIMatrix
    import PowerKPIMatrix = powerbi.extensibility.visual.powerKPIMatrix62829589A9925A388A4404946E71C1FF.PowerKPIMatrix;
    import Settings = powerbi.extensibility.visual.Settings;
    import ScaleService = powerbi.extensibility.visual.ScaleService;
    import ModalWindowService = powerbi.extensibility.visual.ModalWindowService;
    import KPIIndicatorSettings = powerbi.extensibility.visual.KPIIndicatorSettings;
    import IKPIIndicatorSettings = powerbi.extensibility.visual.IKPIIndicatorSettings;
    import RowBasedModelConverter = powerbi.extensibility.visual.RowBasedModelConverter;
    import ColumnBasedModelConverter = powerbi.extensibility.visual.ColumnBasedModelConverter;
    import VisualBuilderBase = powerbi.extensibility.utils.test.VisualBuilderBase;

    // powerbitests.helpers
    import testDom = powerbi.extensibility.utils.test.helpers.testDom;
    import helpers = powerbi.extensibility.utils.test.helpers;

    import DataViewBuilder = powerbi.extensibility.utils.test.dataViewBuilder.TestDataViewBuilder;

    powerbi.extensibility.utils.test.mocks.createLocale();

    describe("Power KPI Matrix", () => {
        // describe("DOM", () => {
        //     let testWrapper: PowerKPIMatrixTestWrapper;

        //     beforeEach(() => testWrapper = PowerKPIMatrixTestWrapper.createWithColumnBasedData());

        //     it("root element should be defined in DOM", (done) => {
        //         testWrapper.visualBuilder.updateRenderTimeout(testWrapper.dataView, () => {
        //             expect(testWrapper.visualBuilder.$root).toBeInDOM();
        //             done();
        //         });
        //     });

        //     it("visual should render cells", (done) => {
        //         testWrapper.visualBuilder.updateRenderTimeout(testWrapper.dataView, () => {
        //             expect(testWrapper.visualBuilder.$cells).toBeInDOM();

        //             done();
        //         });
        //     });
        // });

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
            const selectionIdBuilder = jasmine.createSpyObj('', ['withMeasure', 'createSelectionId'])
            describe("Column-based data", () => {
                let converter: ColumnBasedModelConverter;

                beforeEach(() => {
                    converter = new ColumnBasedModelConverter(selectionIdBuilder);
                });

                it("should not throw exceptions if dataView is undefined", () => {
                    expect(() => {
                        converter.convert({
                            dataView: undefined,
                            columnMapping: undefined,
                            settings: undefined,
                            viewport: undefined
                        });
                    }).not.toThrow();
                });
            });

            describe("Row-based data", () => {
                let converter: RowBasedModelConverter;

                beforeEach(() => {
                    converter = new RowBasedModelConverter(selectionIdBuilder);
                });

                it("should not throw exceptions if dataView is undefined", () => {
                    expect(() => {
                        converter.convert({
                            dataView: undefined,
                            columnMapping: undefined,
                            settings: undefined,
                            viewport: undefined
                        });
                    }).not.toThrow();
                });
            });
        });

        describe("ScaleService", () => {
            let scaleService: ScaleService;

            beforeEach(() => {
                scaleService = new ScaleService();
            });

            it("should return viewport without any scale if element isn't specified", () => {
                const scale: IViewport = scaleService.getScale();

                expect(scale.width).toBe(1);
                expect(scale.height).toBe(1);
            });

            it("should return viewport without any scale if element doesn't have `scale` style", () => {
                scaleService.element = testDom("100px", "100px").get(0);

                const scale: IViewport = scaleService.getScale();

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
                        element: d3.select(document.createElement('div')),
                        componentCreators: [],
                        host: jasmine.createSpyObj('host', [''])
                    });

                    settings = Settings.getDefault() as Settings;
                });

                it("should change background color to black", () => {
                    const color: string = "black";

                    settings.popOutGeneralSettings.backgroundColor = color;

                    spyOn(modalWindowService, "updateBackgroundColor");

                    modalWindowService.render({
                        viewport: {
                            width: 300,
                            height: 300
                        },
                        settings,
                    });

                    expect(modalWindowService["updateBackgroundColor"]).toHaveBeenCalledWith(
                        jasmine.any(Object),
                        color
                    );
                });

                it("should be hidden if pop-out is turned off at Format Panel", () => {
                    settings.popOutGeneralSettings.show = false;

                    modalWindowService.render({
                        viewport: {
                            width: 300,
                            height: 300
                        },
                        settings,
                    });

                    expect(modalWindowService.isShown).toBeFalsy();
                });

                it("should be visible if pop-out is turned on at Format Panel", () => {
                    settings.popOutGeneralSettings.show = true;

                    modalWindowService.render({
                        viewport: {
                            width: 300,
                            height: 300
                        },
                        settings,
                    });

                    expect(modalWindowService.isShown).toBeTruthy();
                });
            });
        });
    });
}