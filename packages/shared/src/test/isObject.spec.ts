import { describe, expect, it, test } from "vitest";
import { isObject, isString } from "../index"

test('isObject-object', () => {
  expect(isObject({})).toBe(true);
})

test('isObject-string', () => {
  expect(isObject('')).toBe(false);
})

test('isObject-number', () => {
  expect(isObject(0)).toBe(false);
})

test('isObject-boolean', () => {
  expect(isObject(null)).toBe(false);
})