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

export enum HorizontalTextAlignment {
    left = <any>"left",
    center = <any>"center",
    right = <any>"right",
}

export enum VerticalTextAlignment {
    top = <any>"top",
    center = <any>"center",
    bottom = <any>"bottom",
}

export const verticalTextAlignmentIEnumType: IEnumType = createEnumType([
    {
        value: VerticalTextAlignment.top,
        displayName: "Top"
    },
    {
        value: VerticalTextAlignment.center,
        displayName: "Center"
    },
    {
        value: VerticalTextAlignment.bottom,
        displayName: "Bottom"
    },
]);

export enum WrapText {
    NoWrap,
    Wrap,
    BreakWord,
}

export const wrapTextIEnumType: IEnumType = createEnumType([
    {
        value: WrapText.NoWrap,
        displayName: "No-wrap"
    },
    {
        value: WrapText.Wrap,
        displayName: "Wrap"
    },
    {
        value: WrapText.BreakWord,
        displayName: "Break Word"
    },
]);

export class FontSettings
    extends LabelSettings
    implements SettingsWithParser {

    private minImageSize: number = Number.MIN_VALUE;
    private maxImageSize: number = 4096;

    public isHyperlinkSpecified: boolean;
    public isImageSpecified: boolean;

    public fontSize: string; // Power BI handles font size as a string value for some reason
    public wrapText: WrapText;
    public isBold: boolean;
    public isItalic: boolean;
    public isUnderlined: boolean;
    public isHyperlinkUnderlined: boolean;
    public fontFamily: string;
    public alignment: HorizontalTextAlignment;
    public verticalAlignment: VerticalTextAlignment;
    public shouldMatchKPIColor: boolean;
    public color: string;
    public hyperlinkColor: string;
    public shouldShowLabel: boolean;
    public shouldShowImage: boolean;
    public imageIconWidth: number;
    public imageIconHeight: number;
    public backgroundColor: string;

    public get textFontSize(): number {
        return +this.fontSize; // Power BI returns numbers as string for some reason. This line converts into number
    }

    public set textFontSize(size: number) {
        this.fontSize = `${size}`;
    }

    public constructor() {
        super();

        this.setDefault();
    }

    public setDefault(): void {
        this.isHyperlinkSpecified = false;
        this.isImageSpecified = false;

        this.fontSize = "8";
        this.wrapText = WrapText.Wrap;
        this.isBold = false;
        this.isItalic = false;
        this.isUnderlined = false;
        this.isHyperlinkUnderlined = true;
        this.fontFamily = "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif";
        this.alignment = HorizontalTextAlignment.right;
        this.verticalAlignment = VerticalTextAlignment.center;
        this.shouldMatchKPIColor = true;
        this.color = "#000";
        this.hyperlinkColor = "#0000EE";
        this.shouldShowLabel = true;
        this.shouldShowImage = true;
        this.imageIconWidth = undefined;
        this.imageIconHeight = undefined;
        this.backgroundColor = undefined;
    }

    public updateHyperlinkVisibility(visibility: boolean): void {
        if (this.isHyperlinkSpecified) {
            return;
        }

        this.changeVisibilityOfHyperlinkProperties(visibility);

        this.isHyperlinkSpecified = visibility;
    }

    public updateImageVisibility(visibility: boolean) {
        if (this.isImageSpecified) {
            return;
        }

        this.changeVisibilityOfImageProperties(visibility);

        this.isImageSpecified = visibility;
    }

    public hideCommonProperties(): void {
        this.changeVisibilityOfCommonProperties(false);
    }

    private changeVisibilityOfCommonProperties(enumerable: boolean): void {
        Object.defineProperties(this, {
            isUnderlined: {
                enumerable,
            },
        });

        this.changeVisibilityOfColor(enumerable);
    }

    protected changeVisibilityOfColor(enumerable: boolean): void {
        Object.defineProperties(this, {
            color: {
                enumerable,
            },
        });
    }

    private changeVisibilityOfHyperlinkProperties(enumerable: boolean): void {
        Object.defineProperties(this, {
            isHyperlinkUnderlined: {
                enumerable,
            },
            hyperlinkColor: {
                enumerable,
            },
        });
    }

    private changeVisibilityOfImageProperties(enumerable: boolean): void {
        const isImageSizeShown: boolean = enumerable && this.shouldShowImage;

        Object.defineProperties(this, {
            shouldShowLabel: {
                enumerable,
            },
            shouldShowImage: {
                enumerable,
            },
            imageIconWidth: {
                enumerable: isImageSizeShown,
            },
            imageIconHeight: {
                enumerable: isImageSizeShown,
            },
        });
    }

    public getColor(isHyperlinkSpecified: boolean): string {
        if (isHyperlinkSpecified) {
            return this.hyperlinkColor;
        }

        return this.color;
    }

    public isTextUnderlined(isHyperlinkSpecified: boolean): boolean {
        if (isHyperlinkSpecified) {
            return this.isHyperlinkUnderlined;
        }

        return this.isUnderlined;
    }

    public parse(): void {
        super.parse();

        if (!this.shouldShowLabel && !this.shouldShowImage) {
            this.shouldShowLabel = true;
        }

        this.imageIconHeight = this.getImageSize(this.imageIconHeight, this.minImageSize, this.maxImageSize);
        this.imageIconWidth = this.getImageSize(this.imageIconWidth, this.minImageSize, this.maxImageSize);
    }

    private getImageSize(imageSize: number, minImageSize: number, maxImageSize: number): number {
        return NumericValueUtils.isValueFinite(imageSize) && imageSize > minImageSize
            ? Math.min(imageSize, maxImageSize)
            : undefined;
    }
}
