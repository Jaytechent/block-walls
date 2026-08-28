const records = new Map();

function clone(value) {
  if (!value) return value;
  return { ...value, ...(value.expiresAt ? { expiresAt: new Date(value.expiresAt) } : {}) };
}

function matches(record, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === "$or") return expected.some((part) => matches(record, part));
    const actual = record[key];
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      if ("$ne" in expected) return actual !== expected.$ne;
      if ("$in" in expected) return expected.$in.includes(actual);
      if ("$lt" in expected) return actual && new Date(actual) < new Date(expected.$lt);
    }
    return actual === expected;
  });
}

function query(getter) {
  const run = async () => getter();
  return { lean: run, then: (resolve, reject) => run().then(resolve, reject), catch: (reject) => run().catch(reject) };
}

function applyUpdate(record, update, isNew) {
  if (isNew && update.$setOnInsert) Object.assign(record, update.$setOnInsert);
  if (update.$set) Object.assign(record, update.$set);
  if (update.$unset) Object.keys(update.$unset).forEach((key) => delete record[key]);
}

class MemoryDocument {
  constructor(value) { Object.assign(this, clone(value)); }
  async save() {
    records.set(this.blockId, clone(this));
    return this;
  }
}

const MemoryBlock = {
  find(filter) {
    return query(() => [...records.values()].filter((record) => matches(record, filter)).map(clone));
  },
  findOne(filter) {
    return query(() => {
      const record = [...records.values()].find((item) => matches(item, filter));
      return record ? new MemoryDocument(record) : null;
    });
  },
  findOneAndUpdate(filter, update, options = {}) {
    return query(() => {
      let record = [...records.values()].find((item) => matches(item, filter));
      const isNew = !record;
      if (!record && !options.upsert) return null;
      if (!record) record = { status: "AVAILABLE", moderationStatus: "PENDING_REVIEW" };
      const before = clone(record);
      applyUpdate(record, update, isNew);
      records.set(record.blockId, clone(record));
      return new MemoryDocument(options.new ? record : before);
    });
  },
  async countDocuments(filter) {
    return [...records.values()].filter((record) => matches(record, filter)).length;
  },
  async updateMany(filter, update) {
    let modifiedCount = 0;
    for (const record of records.values()) {
      if (matches(record, filter)) {
        applyUpdate(record, update, false);
        records.set(record.blockId, clone(record));
        modifiedCount++;
      }
    }
    return { modifiedCount };
  },
};

module.exports = MemoryBlock;
