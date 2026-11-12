import { useEffect, useState } from 'react'
import { catalogApi, planApi } from '../api/services'

/**
 * Dữ liệu dùng chung lấy từ BE (không ghi cứng trong FE), tải 1 lần mỗi phiên rồi dùng lại:
 * - useGrades(): các lớp có lộ trình + lớp nào đã có bản đồ ải chơi được
 * - usePlanInfo(): số ngày dùng thử, giá gói rẻ nhất cho học sinh / trung tâm
 */
const cache = {}
const pending = {}

function load(key, fetcher) {
  if (cache[key]) return Promise.resolve(cache[key])
  if (!pending[key]) {
    pending[key] = fetcher()
      .then((data) => { cache[key] = data; return data })
      .finally(() => { delete pending[key] })
  }
  return pending[key]
}

function useCached(key, fetcher) {
  const [data, setData] = useState(cache[key] || null)
  const [error, setError] = useState(null)
  useEffect(() => {
    let alive = true
    load(key, fetcher).then((d) => alive && setData(d)).catch((e) => alive && setError(e))
    return () => { alive = false }
  }, [key, fetcher])
  return { data, error }
}

/** grades: [{ gradeLevel, name, publishedLessons, pendingLessons, chapters, semesters, ready }] */
export function useGrades() {
  const { data, error } = useCached('grades', catalogApi.grades)
  const grades = data || []
  return { grades, gradeLevels: grades.map((g) => g.gradeLevel), loading: !data && !error, error }
}

/** Số liệu trang giới thiệu: số ải, ải trùm, thú, AI, đề kiểm tra, các lớp đã có bản đồ */
export function useSiteStats() {
  const { data } = useCached('stats', catalogApi.stats)
  return data
}

/** Tóm tắt bảng giá từ gói đang bán (admin đổi giá / số ngày dùng thử thì FE tự đổi theo) */
export function summarizePlans(plans) {
  const list = plans || []
  const trial = list.find((p) => p.trial)
  const minPrice = (audience) => {
    const prices = list.filter((p) => p.audience === audience && !p.trial && Number(p.price) > 0).map((p) => Number(p.price))
    return prices.length ? Math.min(...prices) : null
  }
  const orgPrices = [minPrice('CENTER'), minPrice('SCHOOL')].filter((x) => x != null)
  const cheapestStudent = list
    .filter((p) => p.audience === 'STUDENT' && !p.trial && Number(p.price) > 0)
    .sort((a, b) => Number(a.price) - Number(b.price))[0]
  return {
    trialDays: trial?.durationDays || null,
    minStudentPrice: minPrice('STUDENT'),
    cheapestStudentPlan: cheapestStudent || null,
    minOrgPrice: orgPrices.length ? Math.min(...orgPrices) : null,
    minSeats: (audience) => list.filter((p) => p.audience === audience && p.minSeats).map((p) => p.minSeats).sort((a, b) => a - b)[0] || null,
  }
}

export function usePlanInfo() {
  const { data } = useCached('plans', planApi.plans)
  return { plans: data || [], ...summarizePlans(data) }
}

/** "7 ngày học thử 0đ" hoặc "Học thử miễn phí" khi chưa tải xong / chưa có gói dùng thử */
export const trialLabel = (days) => (days ? `${days} ngày học thử 0đ` : 'Học thử miễn phí')
