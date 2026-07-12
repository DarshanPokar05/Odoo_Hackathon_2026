import { AssetValidationSchema } from '../components/AssetForm';

describe('Asset Validation Schema', () => {
  it('should pass validation with valid minimum asset inputs', () => {
    const result = AssetValidationSchema.safeParse({
      name: 'MacBook Pro 14',
      categoryId: '123e4567-e89b-12d3-a456-426614174000', // valid UUID
      condition: 'NEW',
      isBookable: false,
    });
    expect(result.success).toBe(true);
  });

  it('should pass validation with full inputs', () => {
    const result = AssetValidationSchema.safeParse({
      name: 'iPad Pro',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      serialNumber: 'SN-IPAD-1122',
      manufacturer: 'Apple',
      model: 'M4 11-inch',
      acquisitionDate: '2026-05-01',
      acquisitionCost: 999,
      currentValue: 950,
      location: 'HQ Office',
      condition: 'NEW',
      isBookable: true,
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0', displayOrder: 0 }
      ],
      documents: [
        { documentName: 'Quickstart Guide.pdf', documentUrl: 'https://apple.com/guide', documentType: 'PDF' }
      ]
    });
    expect(result.success).toBe(true);
  });

  it('should fail validation when name is empty', () => {
    const result = AssetValidationSchema.safeParse({
      name: '',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      condition: 'NEW',
    });
    expect(result.success).toBe(false);
  });

  it('should fail validation when categoryId is not a valid UUID', () => {
    const result = AssetValidationSchema.safeParse({
      name: 'Office Desk',
      categoryId: 'invalid-uuid-format',
      condition: 'GOOD',
    });
    expect(result.success).toBe(false);
  });

  it('should fail validation when condition is invalid', () => {
    const result = AssetValidationSchema.safeParse({
      name: 'Office Desk',
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      condition: 'NOT_EXISTING_CONDITION',
    });
    expect(result.success).toBe(false);
  });
});
