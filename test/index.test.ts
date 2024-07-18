import { describe, expect, it, test } from "vitest"
import { matchQueryCondition, parseQueryCondition, query, type QueryCondition } from "../src"

// 创建一个模拟数据
const mockData = {
  _id: "123",
  name: "John",
  age: 25,
  gender: "male"
}

// 创建一个测试套件
describe("matchFilterCondition", () => {
  // 测试用例1：当数据和条件都为空时，应该返回true
  test("should return true when data and condition are empty", () => {
    const result = matchQueryCondition({} as any, {})
    expect(result).toBeTruthy()
  })

  // 测试用例2：当数据不为空，条件为空时，应该返回true
  test("should return true when data is not empty and condition is empty", () => {
    const result = matchQueryCondition(mockData, {})
    expect(result).toBeTruthy()
  })

  // 测试用例3：当数据为空，条件不为空时，应该返回false
  test("should return false when data is empty and condition is not empty", () => {
    const result = matchQueryCondition({} as any, { name: "John" })
    expect(result).toBeFalsy()
  })

  // 测试用例4：当数据和条件都不为空时，且数据满足条件，应该返回true
  test("should return true when data and condition are not empty and data matches condition", () => {
    const condition: QueryCondition<typeof mockData> = { name: "John" }
    const result = matchQueryCondition(mockData, condition)
    expect(result).toBeTruthy()
  })

  // 测试用例5：当数据和条件都不为空时，且数据不满足条件，应该返回false
  test("should return false when data and condition are not empty and data does not match condition", () => {
    const condition: QueryCondition<typeof mockData> = { name: "Jane" }
    const result = matchQueryCondition(mockData, condition)
    expect(result).toBeFalsy()
  })
})

describe("matchQueryCondition", () => {
  it("should return true for matching condition", () => {
    const data = { _id: "1", name: "John", age: 30 }
    const condition = { age: { $equal: 30 } }
    const result = matchQueryCondition(data, condition)
    expect(result).toBeTruthy()
  })

  it("should return false for non-matching condition", () => {
    const data = { _id: "1", name: "John", age: 30 }
    const condition = { age: { $equal: 25 } }
    const result = matchQueryCondition(data, condition)
    expect(result).toBeFalsy()
  })

  it("should handle $or condition", () => {
    const data = { _id: "1", name: "John", age: 30 }
    const condition = { $or: [{ age: { $equal: 30 } }, { name: { $equal: "Jane" } }] }
    const result = matchQueryCondition(data, condition)
    expect(result).toBeTruthy()
  })

  it("should handle nested conditions", () => {
    const data = { _id: "1", user: { name: "John", age: 30 } }
    const condition = { user: { age: { $equal: 30 } } }
    const result = matchQueryCondition(data, condition)
    expect(result).toBeTruthy()
  })

  // Add more tests to cover various conditions and scenarios
})

describe("query", () => {
  it("should return a function when condition is provided", () => {
    const condition = { age: { $equal: 30 } }
    const filter = query(condition)
    expect(typeof filter).toBe("function")
  })

  it("should return a function that returns true for matching values", () => {
    const condition = { age: { $equal: 30 } }
    const filter = query(condition)
    const data = { _id: "1", name: "John", age: 30 }
    expect(filter(data)).toBeTruthy()
  })

  it("should return a function that returns false for non-matching values", () => {
    const condition = { age: { $equal: 30 } }
    const filter = query(condition)
    const data = { _id: "1", name: "John", age: 25 }
    expect(filter(data)).toBeFalsy()
  })

  // Add more tests to cover various conditions and scenarios
})

describe("parseQueryCondition", () => {
  it("should return an empty array when no condition is provided", () => {
    const result = parseQueryCondition()
    expect(result).toEqual([])
  })

  it("should return an array of filter predicates for simple condition", () => {
    const condition = { age: 30 }
    const result = parseQueryCondition(condition)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]({ age: 30 })).toBeTruthy()
    expect(result[0]({ age: 25 })).toBeFalsy()
  })

  it("should return an array of filter predicates for nested condition", () => {
    const condition = { user: { age: 30 } }
    const result = parseQueryCondition(condition)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]({ user: { age: 30 } })).toBeTruthy()
    expect(result[0]({ user: { age: 25 } })).toBeFalsy()
  })

  // Add more tests to cover various conditions and scenarios
})

describe("query function", () => {
  it("should return true for a basic equality condition", () => {
    const condition = { name: "John" }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", age: 30 })).toBe(true)
    expect(queryFn({ name: "Jane", age: 25 })).toBe(false)
  })

  it("should handle nested conditions", () => {
    const condition = { address: { city: "New York" } }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", address: { city: "New York", zip: "10001" } })).toBe(true)
    expect(queryFn({ name: "John", address: { city: "Los Angeles", zip: "90001" } })).toBe(false)
  })

  it("should handle $or logical operator", () => {
    const condition = { $or: [{ name: "John" }, { age: 30 }] }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", age: 25 })).toBe(true)
    expect(queryFn({ name: "Jane", age: 30 })).toBe(true)
    expect(queryFn({ name: "Doe", age: 20 })).toBe(false)
  })

  it("should handle $nor logical operator", () => {
    const condition = { $nor: [{ name: "John" }, { age: 30 }] }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", age: 25 })).toBe(false)
    expect(queryFn({ name: "Jane", age: 30 })).toBe(false)
    expect(queryFn({ name: "Doe", age: 20 })).toBe(true)
  })

  it("should handle empty conditions", () => {
    const queryFn = query()
    expect(queryFn({ name: "John", age: 30 })).toBe(true)
    expect(queryFn({ name: "Jane", age: 25 })).toBe(true)
  })

  it("should handle null conditions", () => {
    const queryFn = query(null)
    expect(queryFn({ name: "John", age: 30 })).toBe(true)
    expect(queryFn({ name: "Jane", age: 25 })).toBe(true)
  })

  it("should handle complex nested conditions with logical operators", () => {
    const condition = {
      $or: [
        { name: "John" },
        {
          $and: [{ age: { $greater: 25 } }, { address: { city: "New York" } }]
        }
      ]
    }
    // 注意：这里的 $and 需要额外处理，但假设 parseQueryCondition 已经能够处理它
    const queryFn = query(condition)
    expect(queryFn({ name: "John", age: 30, address: { city: "Los Angeles" } })).toBe(true)
    expect(queryFn({ name: "Jane", age: 30, address: { city: "New York" } })).toBe(true)
    expect(queryFn({ name: "Doe", age: 20, address: { city: "New York" } })).toBe(false)
  })

  it("should handle conditions with deep equal", () => {
    const condition = { details: { skills: ["JavaScript", "TypeScript"] } }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", details: { skills: ["JavaScript", "TypeScript"] } })).toBe(true)
    expect(queryFn({ name: "John", details: { skills: ["JavaScript", "React"] } })).toBe(false)
  })

  it("should handle conditions with $not", () => {
    const condition = { name: { $not: "John" } }
    const queryFn = query(condition)
    expect(queryFn({ name: "John", age: 30 })).toBe(false)
    expect(queryFn({ name: "Jane", age: 25 })).toBe(true)
  })

  describe("matchQueryCondition", () => {
    describe("$in", () => {
      it("should match when the value is in the array", () => {
        const data = { _id: "1", status: "active" }
        const condition = { status: { $in: ["active", "inactive"] } }
        expect(matchQueryCondition(data, condition)).toBe(true)
      })

      it("should not match when the value is not in the array", () => {
        const data = { _id: "1", status: "pending" }
        const condition = { status: { $in: ["active", "inactive"] } }
        expect(matchQueryCondition(data, condition)).toBe(false)
      })
    })

    describe("$notIn", () => {
      it("should match when the value is not in the array", () => {
        const data = { _id: "1", status: "pending" }
        const condition = { status: { $notIn: ["active", "inactive"] } }
        expect(matchQueryCondition(data, condition)).toBe(true)
      })

      it("should not match when the value is in the array", () => {
        const data = { _id: "1", status: "active" }
        const condition = { status: { $notIn: ["active", "inactive"] } }
        expect(matchQueryCondition(data, condition)).toBe(false)
      })
    })

    describe("$contains", () => {
      it("should match when the array contains the value", () => {
        const data = { _id: "1", tags: ["tech", "javascript"] }
        const condition = { tags: { $contains: "javascript" } }
        expect(matchQueryCondition(data, condition as any)).toBe(true)
      })

      it("should match when the string contains the substring", () => {
        const data = { _id: "1", description: "A simple JavaScript example" }
        const condition = { description: { $contains: "JavaScript" } }
        expect(matchQueryCondition(data, condition)).toBe(true)
      })

      it("should not match when the array does not contain the value", () => {
        const data = { _id: "1", tags: ["tech", "html"] }
        const condition = { tags: { $contains: "javascript" } }
        expect(matchQueryCondition(data, condition as any)).toBe(false)
      })

      it("should not match when the string does not contain the substring", () => {
        const data = { _id: "1", description: "A simple HTML example" }
        const condition = { description: { $contains: "JavaScript" } }
        expect(matchQueryCondition(data, condition)).toBe(false)
      })
    })

    describe("$notContains", () => {
      it("should match when the array does not contain the value", () => {
        const data = { _id: "1", tags: ["tech", "html"] }
        const condition = { tags: { $notContains: "javascript" } }
        expect(matchQueryCondition(data, condition as any)).toBe(true)
      })

      it("should match when the string does not contain the substring", () => {
        const data = { _id: "1", description: "A simple HTML example" }
        const condition = { description: { $notContains: "JavaScript" } }
        expect(matchQueryCondition(data, condition)).toBe(true)
      })

      it("should not match when the array contains the value", () => {
        const data = { _id: "1", tags: ["tech", "javascript"] }
        const condition = { tags: { $notContains: "javascript" } }
        expect(matchQueryCondition(data, condition as any)).toBe(false)
      })

      it("should not match when the string contains the substring", () => {
        const data = { _id: "1", description: "A simple JavaScript example" }
        const condition = { description: { $notContains: "JavaScript" } }
        expect(matchQueryCondition(data, condition)).toBe(false)
      })
    })
  })
  // 添加更多测试用例以覆盖其他条件和边界情况
})
