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

import { LabelSettings } from "./labelSettings";
import { ISettingsWithParser } from "./SettingsWithParser";

export enum LineStyle {
    solidLine = "solidLine",
    dottedLine = "dottedLine",
    dashedLine = "dashedLine",
    dotDashedLine = "dotDashedLine",
}

export class SparklineSettings
    extends LabelSettings
    implements ISettingsWithParser {

    public isActualVisible: boolean = true;
    public actualColor: string = "#3599b8";
    public shouldActualUseKPIColors: boolean = false;
    public actualThickness: number = 2;
    public actualLineStyle: LineStyle = LineStyle.solidLine;

    public isTargetVisible: boolean = false;
    public targetColor: string = "#000000";
    public targetThickness: number = 1;
    public targetLineStyle: LineStyle = LineStyle.solidLine;

    public isSecondComparisonValueVisible: boolean = false;
    public secondComparisonValueColor: string = "#7d4f73";
    public secondComparisonValueThickness: number = 1;
    public secondComparisonValueLineStyle: LineStyle = LineStyle.solidLine;

    public shouldUseCommonScale: boolean = false;

    public yMin: number = undefined;
    public yMax: number = undefined;

    public verticalReferenceLineColor: string = "#666";
    public verticalReferenceLineThickness: number = 1;

    private radiusFactor: number = 1.4;

    private minThickness: number = 0.25;
    private maxThickness: number = 10;

    public parse(): void {
        this.actualThickness = this.parseThickness(this.actualThickness);
        this.targetThickness = this.parseThickness(this.targetThickness);
        this.secondComparisonValueThickness = this.parseThickness(this.secondComparisonValueThickness);
        this.verticalReferenceLineThickness = this.parseThickness(this.verticalReferenceLineThickness);

        super.parse();
    }

    public getMaxThickness(): number {
        return Math.max(
            this.isActualVisible ? this.actualThickness : this.minThickness,
            this.isTargetVisible ? this.targetThickness : this.minThickness,
            this.isSecondComparisonValueVisible ? this.secondComparisonValueThickness : this.minThickness,
        );
    }

    public getOffset(): number {
        return this.getMaxThickness() * this.radiusFactor;
    }

    private parseThickness(thickness: number): number {
        return Math.min(
            Math.max(this.minThickness, thickness),
            this.maxThickness);
    }
}
