/**
 * Media extensions module barrel export
 * Exports: CustomImage, Video, Audio, Coordinates extensions
 *
 * Task 3.1: Extract media extensions with proper parseHTML/renderHTML
 * Task 3.2: Create separate NodeView files and register with extensions
 */

// Extensions (Task 3.1)
export { CustomImage } from './ImageExtension';
export { Video } from './VideoExtension';
export { Audio } from './AudioExtension';
export { Coordinates } from './CoordinatesExtension';

// NodeViews (Task 3.2)
export { ImageNodeView } from './ImageNodeView';
export { VideoNodeView } from './VideoNodeView';
export { AudioNodeView } from './AudioNodeView';
export { CoordinatesNodeView } from './CoordinatesNodeView';
