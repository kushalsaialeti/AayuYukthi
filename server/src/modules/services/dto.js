import { pick } from '../../utils/dto.js';

const FIELDS = [
  'id', 'slug', 'title_en', 'description_en', 'benefits_en', 'image_media_id',
  'sort_order', 'status', 'is_visible', 'subtitle_en', 'icon', 'category', 'created_at', 'updated_at',
];

export function toServiceDto(row) {
  return pick(row, FIELDS);
}
