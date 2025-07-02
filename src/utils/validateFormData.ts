interface ValidationOptions {
    requiredFields?: string[];
    patternValidations?: Record<string, 'string' | 'number' | 'boolean'>;
    fileExtensionValidations?: Record<string, string[]>;
}

interface ValidationResult {
    isValid: boolean;
    error?: Record<string, string>;
    message: string;
}

function toReadableFieldName(field: string): string {
    // Converts camelCase or snake_case to Title Case
    return field
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, char => char.toUpperCase());
}

export function validateFormData(
    formData: FormData,
    {
        requiredFields = [],
        patternValidations = {},
        fileExtensionValidations = {}
    }: ValidationOptions
): ValidationResult {
    const error: Record<string, string> = {};

    // Required fields
    for (const field of requiredFields) {
        const value = formData.get(field);
        if (value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
            error[field] = `${toReadableFieldName(field)} is required`;
        }
    }

    // Pattern validations
    for (const [field, expectedType] of Object.entries(patternValidations)) {
        const value = formData.get(field);
        if (value !== null) {
            const val = typeof value === 'string' ? value.trim() : value;

            const isInvalidNumber = expectedType === 'number' && isNaN(Number(val));
            const isInvalidBoolean =
                expectedType === 'boolean' &&
                !['true', 'false', '1', '0', true, false, 1, 0, 'active', 'inactive'].includes(val.toString().toLowerCase());

            if (isInvalidNumber || isInvalidBoolean) {
                error[field] = `${toReadableFieldName(field)} must be a valid ${expectedType}`;
            }
        }
    }

    // File extension validations
    for (const [field, allowedExtensions] of Object.entries(fileExtensionValidations) as [string, string[]][]) {
        const file = formData.get(field);
        if (file instanceof File) {
            const fileName = file.name.toLowerCase();
            const fileExtension = fileName.split('.').pop() || '';
            if (!allowedExtensions.map(ext => ext.toLowerCase()).includes(fileExtension)) {
                error[field] = `${toReadableFieldName(field)} must be one of the following file types: ${allowedExtensions.join(', ')}`;
            }
        } else if (file !== null) {
            error[field] = `${toReadableFieldName(field)} must be a valid file`;
        }
    }

    const errorCount = Object.keys(error).length;

    return {
        isValid: errorCount === 0,
        ...(errorCount > 0 && { error }),
        message:
            errorCount === 0
                ? 'Form submitted successfully.'
                : `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct and try again.`,
    };
}