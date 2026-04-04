export function rowToTask(r) {
    return {
        id: r.id,
        title: r.title,
        forDate: r.for_date ?? null,
        notes: r.notes,
        completed: Boolean(r.completed),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        ownerId: r.owner_id,
    };
}
export function rowToSettings(r) {
    return {
        id: r.id,
        ownerId: r.owner_id,
        expirationDays: r.expiration_days,
    };
}
