import type {Color} from '../../expression/types/color';
import type {ResolvedImage} from '../types/resolved_image';

export const VERTICAL_ALIGN_OPTIONS = ['bottom', 'center', 'top'] as const;
export type VerticalAlign = typeof VERTICAL_ALIGN_OPTIONS[number];

export class FormattedSection {
    text: string;
    image: ResolvedImage | null;
    scale: number | null;
    fontStack: string | null;
    textColor: Color | null;
    verticalAlign: VerticalAlign | null;

    constructor(text: string, image: ResolvedImage | null, scale: number | null, fontStack: string | null, textColor: Color | null, verticalAlign: VerticalAlign | null) {
        this.text = text;
        this.image = image;
        this.scale = scale;
        this.fontStack = fontStack;
        this.textColor = textColor;
        this.verticalAlign = verticalAlign;
    }
}

export class Formatted {
    sections: Array<FormattedSection>;

    constructor(sections: Array<FormattedSection>) {
        this.sections = sections;
    }

    static fromString(unformatted: string): Formatted {
        return new Formatted([new FormattedSection(unformatted, null, null, null, null, null)]);
    }

    isEmpty(): boolean {
        if (this.sections.length === 0) return true;
        return !this.sections.some(section => section.text.length !== 0 ||
                                             (section.image && section.image.name.length !== 0));
    }

    static factory(text: Formatted | string): Formatted {
        if (text instanceof Formatted) {
            return text;
        } else {
            return Formatted.fromString(text);
        }
    }

    toString(): string {
        if (this.sections.length === 0) return '';
        return this.sections.map(section => section.text).join('');
    }
}
