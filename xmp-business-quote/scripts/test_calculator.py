#!/usr/bin/env python3
"""Regression tests for the deterministic XMP quote calculator."""

from __future__ import annotations

import unittest

from calculate_quote import calculate, render_markdown


class QuoteCalculatorTests(unittest.TestCase):
    def test_full_usd_request_recommends_vip_and_applies_only_explicit_deductions(self) -> None:
        result = calculate(
            {
                "currency": "usd",
                "needs": {
                    "major_media": 2,
                    "monthly_ads_wan": 12,
                    "annual_ads_wan_for_reference": 144,
                    "users": 120,
                    "ad_accounts": 7000,
                    "report_api": False,
                    "trial_runs": 0,
                },
                "explicit_no": ["report_api", "trial_runs"],
            }
        )
        self.assertEqual(result["recommended_plan"], "VIP 版")
        self.assertEqual(result["original_activity_total"], 36200)
        self.assertEqual(result["deduction_total"], 9250)
        self.assertEqual(result["adjusted_activity_total"], 26950)
        self.assertEqual(result["recommended_price_90"], 24255)
        self.assertEqual(result["minimum_price_60"], 16170)
        self.assertEqual(result["final_discount"], 9.0)
        self.assertIsNone(result["actual_quote"])
        self.assertIsNone(result["current_quote_discount_vs_original_activity"])
        self.assertEqual(result["suggested_quote"], 24255)
        self.assertEqual(
            {item["item_id"]: item["subtotal"] for item in result["deductions"]},
            {"major_media": 5600, "report_api": 1650, "trial_runs": 2000},
        )
        self.assertNotIn("attribution_api", {item["item_id"] for item in result["deductions"]})
        self.assertEqual(
            {item["plan"]: item["original_activity_total"] for item in result["plan_comparison"]},
            {"基础版": 51700, "高级版": 47650, "专业版": 44000, "VIP 版": 36200},
        )

    def test_explicit_quote_adds_discount_against_original_activity_total(self) -> None:
        result = calculate(
            {
                "currency": "usd",
                "actual_quote": 11500,
                "major_media_names": ["TikTok", "Meta"],
                "needs": {
                    "major_media": 2,
                    "annual_ads_wan_for_reference": 144,
                    "monthly_ads_wan": 12,
                    "users": 120,
                    "ad_accounts": 7000,
                },
            }
        )
        self.assertEqual(result["recommended_plan"], "VIP 版")
        self.assertEqual(result["actual_quote"], 11500)
        self.assertEqual(result["original_activity_total"], 36200)
        self.assertEqual(result["deduction_total"], 5600)
        self.assertEqual(result["adjusted_activity_total"], 30600)
        self.assertEqual(result["final_discount"], 3.76)
        self.assertEqual(result["current_quote_discount_vs_original_activity"], 3.18)
        self.assertEqual(result["recommended_price_90"], 27540)
        self.assertEqual(result["minimum_price_60"], 18360)
        markdown = render_markdown(result)
        self.assertIn("当前报价相对原活动价折扣：** 3.18 折", markdown)
        self.assertIn("$11,500 ÷ 原活动价总价值 $36,200 × 10 = 3.18 折", markdown)
        self.assertTrue(any("低于 6 折最低价" in warning for warning in result["warnings"]))

    def test_non_expiring_ad_is_an_independent_pool_and_never_auto_deducted(self) -> None:
        result = calculate(
            {
                "currency": "cny",
                "needs": {
                    "major_media": 1,
                    "monthly_ads_wan": 3,
                    "non_expiring_ads_wan": 50,
                    "users": 25,
                    "ad_accounts": 100,
                    "report_api": False,
                },
                "explicit_no": ["report_api"],
            }
        )
        self.assertEqual(result["recommended_plan"], "基础版")
        self.assertEqual(result["original_activity_total"], 89000)
        self.assertEqual(result["deduction_total"], 0)
        self.assertEqual(result["recommended_price_90"], 80100)
        self.assertEqual(result["minimum_price_60"], 53400)
        non_expiring = next(
            item for item in result["components"] if item["item_id"] == "non_expiring_ads_wan"
        )
        self.assertEqual(non_expiring["billing_quantity"], 50)
        self.assertEqual(non_expiring["subtotal"], 50000)
        self.assertNotIn("non_expiring_ads_wan", {item["item_id"] for item in result["deductions"]})
        self.assertIn("不过期 Ad 创建总额度", render_markdown(result))

    def test_video_channels_only_gate_capacity_and_deduction_mode_none_is_respected(self) -> None:
        result = calculate(
            {
                "currency": "cny",
                "deduction_mode": "none",
                "needs": {
                    "major_media": 1,
                    "video_channels": 3,
                    "monthly_ads_wan": 3,
                    "users": 25,
                    "ad_accounts": 100,
                },
            }
        )
        self.assertEqual(result["recommended_plan"], "专业版")
        self.assertEqual(result["original_activity_total"], 89000)
        self.assertEqual(result["deduction_total"], 0)
        self.assertEqual(result["deductions"], [])
        comparison = {item["plan"]: item for item in result["plan_comparison"]}
        self.assertFalse(comparison["基础版"]["eligible"])
        self.assertFalse(comparison["高级版"]["eligible"])
        self.assertTrue(comparison["专业版"]["eligible"])
        self.assertNotIn("video_channels", {item["item_id"] for item in result["components"]})

    def test_locked_pro_plan_is_not_replaced_and_can_disable_deductions(self) -> None:
        result = calculate(
            {
                "currency": "cny",
                "locked_plan": "pro",
                "deduction_mode": "none",
                "needs": {
                    "major_media": 1,
                    "monthly_ads_wan": 3,
                    "users": 25,
                    "ad_accounts": 100,
                    "report_api": False,
                    "trial_runs": 0,
                },
                "explicit_no": ["report_api", "trial_runs"],
            }
        )
        self.assertEqual(result["recommended_plan"], "专业版")
        self.assertEqual(result["recommendation_mode"], "user_specified")
        self.assertEqual(result["automatic_recommendation"], "基础版")
        self.assertEqual(result["original_activity_total"], 89000)
        self.assertEqual(result["deduction_total"], 0)
        self.assertNotIn("刊例价", render_markdown(result))

    def test_two_apis_are_independent_addons(self) -> None:
        result = calculate(
            {
                "currency": "usd",
                "deduction_mode": "none",
                "needs": {
                    "major_media": 1,
                    "monthly_ads_wan": 3,
                    "users": 25,
                    "ad_accounts": 100,
                    "report_api": True,
                    "attribution_api": True,
                },
            }
        )
        self.assertEqual(result["recommended_plan"], "基础版")
        self.assertEqual(result["original_activity_total"], 8800)
        self.assertEqual(result["recommended_price_90"], 7920)
        self.assertEqual(result["minimum_price_60"], 5280)
        api_lines = {
            item["item_id"]: item["subtotal"]
            for item in result["components"]
            if item["item_id"] in {"report_api", "attribution_api"}
        }
        self.assertEqual(api_lines, {"report_api": 1650, "attribution_api": 1650})

    def test_annual_ad_volume_without_monthly_peak_requires_clarification(self) -> None:
        result = calculate(
            {
                "currency": "usd",
                "needs": {
                    "major_media": 2,
                    "annual_ads_wan_for_reference": 144,
                    "users": 120,
                    "ad_accounts": 7000,
                    "report_api": False,
                    "trial_runs": 0,
                },
                "explicit_no": ["report_api", "trial_runs"],
            }
        )
        self.assertEqual(result["status"], "needs_clarification")
        self.assertIsNone(result["recommended_plan"])
        self.assertIsNone(result["original_activity_total"])
        self.assertIsNone(result["recommended_price_90"])
        self.assertEqual(
            result["required_questions"],
            ["请确认每月 Ad 创建额度或最高月份峰值是多少万/月？"],
        )

    def test_basic_plus_api_plus_one_extra_major_media_in_both_price_systems(self) -> None:
        expected = {
            "cny": (71000, 63900, 42600),
            "usd": (9950, 8955, 5970),
        }
        for currency, amounts in expected.items():
            with self.subTest(currency=currency):
                result = calculate(
                    {
                        "currency": currency,
                        "locked_plan": "basic",
                        "needs": {"major_media": 2, "report_api": True},
                    }
                )
                self.assertEqual(result["recommended_plan"], "基础版")
                self.assertEqual(result["original_activity_total"], amounts[0])
                self.assertEqual(result["recommended_price_90"], amounts[1])
                self.assertEqual(result["minimum_price_60"], amounts[2])
                self.assertEqual(result["deduction_total"], 0)
                addons = {
                    item["item_id"]: item["subtotal"]
                    for item in result["components"]
                    if item["item_id"] != "base_plan"
                }
                self.assertEqual(set(addons), {"major_media", "report_api"})

    def test_manual_non_expiring_ad_deduction_is_rejected(self) -> None:
        result = calculate(
            {
                "currency": "usd",
                "needs": {"non_expiring_ads_wan": 50},
                "manual_deductions": [
                    {"id": "non_expiring_ads_wan", "quantity": 50, "label": "错误扣减"}
                ],
            }
        )
        self.assertEqual(result["deduction_total"], 0)
        self.assertTrue(any("不能作为减去项" in warning for warning in result["warnings"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
