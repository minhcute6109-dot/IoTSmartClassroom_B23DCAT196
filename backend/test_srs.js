async function runSRSTests() {
  const BASE_URL = "http://localhost:5000/api"
  console.log("====================================================")
  console.log("KIỂM THỬ TOÀN DIỆN BACKEND REST API (SRS COMPLIANT)")
  console.log("====================================================\n")

  // 1. GET /api/sensors (Hợp lệ)
  console.log(
    "1. [TEST] GET /api/sensors (Hợp lệ: page=1, limit=2, sort_key=value, sort_dir=DESC, search_field=sensor_type, search_value=Nhiệt độ)",
  )
  let res = await fetch(
    `${BASE_URL}/sensors?page=1&limit=2&sort_key=value&sort_dir=DESC&search_field=sensor_type&search_value=${encodeURIComponent("Nhiệt độ")}`,
  )
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 2. GET /api/sensors (Lỗi sort_key không hợp lệ)
  console.log(
    "\n2. [TEST] GET /api/sensors (Lỗi: sort_key=invalid_column -> 400)",
  )
  res = await fetch(`${BASE_URL}/sensors?sort_key=invalid_column`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 3. GET /api/sensors (Lỗi search_field không hợp lệ)
  console.log(
    "\n3. [TEST] GET /api/sensors (Lỗi: search_field=invalid_field -> 400)",
  )
  res = await fetch(
    `${BASE_URL}/sensors?search_field=invalid_field&search_value=abc`,
  )
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 4. GET /api/sensors (Lỗi sort_dir không hợp lệ)
  console.log("\n4. [TEST] GET /api/sensors (Lỗi: sort_dir=UP -> 400)")
  res = await fetch(`${BASE_URL}/sensors?sort_dir=UP`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 5. GET /api/sensors (Lỗi page / limit không hợp lệ)
  console.log("\n5. [TEST] GET /api/sensors (Lỗi: page=-1&limit=0 -> 400)")
  res = await fetch(`${BASE_URL}/sensors?page=-1&limit=0`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 6. GET /api/device-states (Xác nhận 3 thiết bị)
  console.log(
    "\n6. [TEST] GET /api/device-states (Xác nhận format SRS và 3 thiết bị)",
  )
  res = await fetch(`${BASE_URL}/device-states`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 7. POST /api/devices/1/control (Đèn - ON)
  console.log("\n7. [TEST] POST /api/devices/1/control (Hợp lệ: action=ON)")
  res = await fetch(`${BASE_URL}/devices/1/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "ON" }),
  })
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 8. POST /api/devices/999/control (Lỗi device_id)
  console.log(
    "\n8. [TEST] POST /api/devices/999/control (Lỗi: device_id=999 -> 400)",
  )
  res = await fetch(`${BASE_URL}/devices/999/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "ON" }),
  })
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 9. GET /api/history (Hợp lệ)
  console.log(
    "\n9. [TEST] GET /api/history (Hợp lệ: page=1, limit=2, sort_key=time, sort_dir=ASC, search_field=device, search_value=Đèn)",
  )
  res = await fetch(
    `${BASE_URL}/history?page=1&limit=2&sort_key=time&sort_dir=ASC&search_field=device&search_value=${encodeURIComponent("Đèn")}`,
  )
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 10. GET /api/history (Lỗi sort_key không hợp lệ)
  console.log(
    "\n10. [TEST] GET /api/history (Lỗi: sort_key=invalid_column -> 400)",
  )
  res = await fetch(`${BASE_URL}/history?sort_key=invalid_column`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 11. GET /api/history (Lỗi search_field không hợp lệ)
  console.log(
    "\n11. [TEST] GET /api/history (Lỗi: search_field=invalid_field -> 400)",
  )
  res = await fetch(
    `${BASE_URL}/history?search_field=invalid_field&search_value=abc`,
  )
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 12. GET /api/profile
  console.log("\n12. [TEST] GET /api/profile (SRS format)")
  res = await fetch(`${BASE_URL}/profile`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))

  // 13. GET /api/device-state (404)
  console.log("\n13. [TEST] GET /api/device-state (Không tồn tại -> 404)")
  res = await fetch(`${BASE_URL}/device-state`)
  console.log("Status:", res.status)
  console.log(JSON.stringify(await res.json(), null, 2))
}

runSRSTests()
