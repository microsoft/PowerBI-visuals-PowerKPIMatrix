/**
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

import { SettingsPropertyBase } from "../settingsPropertyBase";
import { ISettingsWithParser } from "../settingsWithParser";

import { NumericValueUtils } from "../../../utils/numericValueUtils";

export interface IPropertyConfiguration {
    name: string;
    defaultValue: any | ((index: number) => any);
    displayName: (text: string) => string;
}

interface IEnumPropertyConfiguration {
    name: string;
    displayName: string;
}

export enum KPIIndicatorPosition {
    left,
    right,
}

export interface IKPIIndicatorSettings { // This should be synchronized with _properties
    kpiIndex?: number;
    color?: string;
    shape?: string;
}

export class KPIIndicatorSettings
    extends SettingsPropertyBase
    implements ISettingsWithParser {

    public static createDefault(): KPIIndicatorSettings {
        return new KPIIndicatorSettings();
    }

    public isShown: boolean = true;
    public fontSize: string = "8";
    public shouldWrap: boolean = false;

    public horizontalPosition: KPIIndicatorPosition = KPIIndicatorPosition.left;
    public verticalPosition: KPIIndicatorPosition = KPIIndicatorPosition.left;

    private _maxAmountOfKPIs: number = 5;

    private _default: IKPIIndicatorSettings = Object.freeze({
        color: null,
        kpiIndex: NaN,
        shape: null,
    });

    private _colors: string[] = [
        "#01b7a8",
        "#f2c80f",
        "#fd625e",
        "#a66999",
        "#374649",
    ];

    private _shapes: IEnumPropertyConfiguration[] = [
        { name: "circle-full", displayName: "Circle" },
        { name: "triangle", displayName: "Triangle" },
        { name: "rhombus", displayName: "Diamond" },
        { name: "square", displayName: "Square" },
        { name: "flag", displayName: "Flag" },
        { name: "exclamation", displayName: "Exclamation" },
        { name: "checkmark", displayName: "Checkmark" },
        { name: "arrow-up", displayName: "Arrow Up" },
        { name: "arrow-right-up", displayName: "Arrow Right Up" },
        { name: "arrow-right-down", displayName: "Arrow Right Down" },
        { name: "arrow-down", displayName: "Arrow Down" },
        { name: "caret-up", displayName: "Caret Up" },
        { name: "caret-down", displayName: "Caret Down" },
        { name: "circle-empty", displayName: "Circle Empty" },
        { name: "circle-x", displayName: "Circle X" },
        { name: "circle-exclamation", displayName: "Circle Exclamation" },
        { name: "circle-checkmark", displayName: "Circle Checkmark" },
        { name: "x", displayName: "X" },
        { name: "star-empty", displayName: "Star Empty" },
        { name: "star-full", displayName: "Star Full" },
    ];

    private kpiIndexPropertyName: string = "kpiIndex";

    private _properties: IPropertyConfiguration[] = [
        {
            defaultValue: (index: number) => {
                const color: string = this.getElementByIndex<string>(this._colors, index);

                return color || this._colors[0];
            },
            displayName: (text: string) => text,
            name: "color",
        },
        {
            defaultValue: (index: number) => {
                const shape: IEnumPropertyConfiguration =
                    this.getElementByIndex<IEnumPropertyConfiguration>(this._shapes, index);

                return shape
                    ? shape.name
                    : this._shapes[0].name;
            },
            displayName: () => "    Indicator",
            name: "shape",
        },
        {
            defaultValue: (index: number) => index + 1,
            displayName: () => "    Value",
            name: this.kpiIndexPropertyName,
        },
    ];

    public getElementByIndex<Type>(setOfValues: Type[], index: number): Type {
        const amountOfValues: number = setOfValues.length;

        const currentIndex: number = index < amountOfValues
            ? index
            : Math.round(index / amountOfValues);

        return setOfValues[currentIndex];
    }

    public applySettingToContext(): void {
        this.forEach((property: IPropertyConfiguration, index: number, indexedName: string) => {
            this[indexedName] = typeof property.defaultValue === "function"
                ? property.defaultValue(index)
                : property.defaultValue;
        });
    }

    public forEach(iterator: (property: IPropertyConfiguration, index: number, indexedName: string) => void): void {
        for (let index: number = 0; index < this._maxAmountOfKPIs; index++) {
            this._properties.forEach((property: IPropertyConfiguration) => {
                const indexedName: string = this.getPropertyName(property.name, index);

                iterator(property, index, indexedName);
            });
        }
    }

    public get textFontSize(): number {
        return +this.fontSize; // Power BI returns numbers as string for some reason. This line converts into number
    }

    public get position(): KPIIndicatorPosition {
        return this.shouldWrap
            ? this.verticalPosition
            : this.horizontalPosition;
    }

    public parse(): void {
        if (this.shouldWrap) {
            this.hidePropertyByName("horizontalPosition");
        } else {
            this.hidePropertyByName("verticalPosition");
        }
    }

    public getCurrentKPI(kpiIndex: number): IKPIIndicatorSettings {
        if (NumericValueUtils.isValueFinite(kpiIndex)) {
            for (let index: number = 0; index < this._maxAmountOfKPIs; index++) {
                const currentKPIIndex: number = this[this.getPropertyName(this.kpiIndexPropertyName, index)];

                if (currentKPIIndex === kpiIndex) {
                    return this._properties.reduce((
                        current: IKPIIndicatorSettings,
                        property: IPropertyConfiguration,
                    ) => {
                        const indexedName: string = this.getPropertyName(property.name, index);

                        current[property.name] = this[indexedName];

                        return current;
                    }, {});
                }
            }
        }

        return this._default;
    }

    private hidePropertyByName(name: string): void {
        Object.defineProperty(this, name, { enumerable: false, configurable: true });
    }

    private getPropertyName(name: string, index: number): string {
        return `${name}_${index}`;
    }
}
