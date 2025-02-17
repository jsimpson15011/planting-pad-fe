export type LayoutItem = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    boundingBoxWidth: number;
    boundingBoxHeight: number;
} & Record<string, any>
