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

import { SettingsPropertyBase } from "./settingsPropertyBase";
import { ISettingsWithParser } from "./settingsWithParser";

export enum TableType {
    RowBasedKPIS,
    ColumnBasedKPIS,
}

export enum TableStyle {
    Default,
    BoldHeader,
    BoldHeaderAndCurrentValue,
    AlternatingMetrics,
    BoldHeaderAndAlternatingMetrics,
}

export enum SortOrder {
    Ascending,
    Descending,
}

export enum DefaultSortOrderBy {
    Name,
    ColumnOrder,
}

export class TableSettings
    extends SettingsPropertyBase
    implements ISettingsWithParser {

    public type: TableType = TableType.RowBasedKPIS;
    public style: TableStyle = TableStyle.BoldHeader;
    public sortOrder: SortOrder = SortOrder.Ascending;
    public defaultSortOrderBy: DefaultSortOrderBy = DefaultSortOrderBy.ColumnOrder;
    public shouldHideUnmappedMetrics: boolean = true;
    public defaultUnmappedCategoryName: string = "Other";
    public keepSeriesSettingOnFilteringInEditMode: boolean = false;

    public getDefaultUnmappedCategoryName(): string {
        return this.shouldHideUnmappedMetrics
            ? undefined
            : this.defaultUnmappedCategoryName;
    }

    public parse(): void {
        if (this.shouldHideUnmappedMetrics) {
            this.hideProperty("defaultUnmappedCategoryName");
        }
    }

    public isDefaultSortOrderByName(): boolean {
        return this.defaultSortOrderBy === DefaultSortOrderBy.Name;
    }

    public forceToUseDefaultSortOrderByName(): void {
        this.defaultSortOrderBy = DefaultSortOrderBy.Name;
        this.hideProperty("defaultSortOrderBy");
    }

    private hideProperty(name: string): void {
        Object.defineProperty(
            this,
            name,
            {
                enumerable: false,
            },
        );
    }
}
