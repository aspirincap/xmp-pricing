#!/usr/bin/env python3
"""Deterministic XMP package recommendation and quote calculator."""

from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo


PLAN_ORDER = ["basic", "advanced", "pro", "vip"]
PRICING_VERSION = "2026-07-16"
OFFER_VALID_THROUGH = "2026-07-31"
SOURCES_URL_USD = "https://help-xmp.mobvista.com/docs/xmp_price_usd"
SOURCES_URL_CNY = "https://help-xmp.mobvista.com/docs/xmp_price_cny"

PLANS: dict[str, dict[str, Any]] = {
    "basic": {
        "name": "基础版",
        "rank": 0,
        "price": {"cny": 39000, "usd": 5500},
        "included": {
            "major_media": 1,
            "video_channels": 1,
            "monthly_ads_wan": 3,
            "users": 25,
            "ad_accounts": 100,
            "ai_rules": 2,
            "scheduled_reports": 2,
            "storage_tb": 1,
            "youtube_channels": 2,
            "sub_channel_apps": 2,
            "trial_runs": 0,
        },
        "features": {
            "advanced": False,
            "diagnosis": False,
            "report_api": False,
            "attribution_api": False,
            "traffic_pool": False,
        },
    },
    "advanced": {
        "name": "高级版",
        "rank": 1,
        "price": {"cny": 69000, "usd": 9500},
        "included": {
            "major_media": 2,
            "video_channels": 2,
            "monthly_ads_wan": 5,
            "users": 40,
            "ad_accounts": 500,
            "ai_rules": 5,
            "scheduled_reports": 5,
            "storage_tb": 5,
            "youtube_channels": 5,
            "sub_channel_apps": 5,
            "trial_runs": 0,
        },
        "features": {
            "advanced": True,
            "diagnosis": False,
            "report_api": False,
            "attribution_api": False,
            "traffic_pool": False,
        },
    },
    "pro": {
        "name": "专业版",
        "rank": 2,
        "price": {"cny": 89000, "usd": 12500},
        "included": {
            "major_media": 3,
            "video_channels": 3,
            "monthly_ads_wan": 7,
            "users": 60,
            "ad_accounts": 1200,
            "ai_rules": 10,
            "scheduled_reports": 10,
            "storage_tb": 10,
            "youtube_channels": 10,
            "sub_channel_apps": 10,
            "trial_runs": 0,
        },
        "features": {
            "advanced": True,
            "diagnosis": False,
            "report_api": True,
            "attribution_api": True,
            "traffic_pool": False,
        },
    },
    "vip": {
        "name": "VIP 版",
        "rank": 3,
        "price": {"cny": 100000, "usd": 14500},
        "included": {
            "major_media": 4,
            "video_channels": 5,
            "monthly_ads_wan": 10,
            "users": 100,
            "ad_accounts": 2000,
            "ai_rules": 15,
            "scheduled_reports": 15,
            "storage_tb": 20,
            "youtube_channels": 15,
            "sub_channel_apps": 15,
            "trial_runs": 10,
        },
        "features": {
            "advanced": True,
            "diagnosis": True,
            "report_api": True,
            "attribution_api": True,
            "traffic_pool": True,
        },
    },
}

ADDON_PRICE = {
    "major_media": {"cny": 20000, "usd": 2800},
    "monthly_ads_wan": {"cny": 10000, "usd": 1400},
    "non_expiring_ads_wan": {"cny": 1000, "usd": 120},
    "ai_rules": {"cny": 1000, "usd": 140},
    "ad_accounts": {"cny": 2500, "usd": 350},
    "ad_accounts_high": {"cny": 5000, "usd": 710},
    "scheduled_reports": {"cny": 800, "usd": 70},
    "users": {"cny": 500, "usd": 70},
    "storage_tb": {"cny": 2000, "usd": 280},
    "youtube_channels": {"cny": 1000, "usd": 140},
    "sub_channel_apps": {"cny": 1000, "usd": 140},
    "trial_runs": {"cny": 1500, "usd": 200},
    "report_api": {"cny": 12000, "usd": 1650},
    "attribution_api": {"cny": 12000, "usd": 1650},
}

FLOW_PRICE = {
    "basic": {"cny": 20000, "usd": 2800},
    "advanced": {"cny": 15000, "usd": 2100},
    "pro": {"cny": 10000, "usd": 1400},
    "vip": {"cny": 0, "usd": 0},
}

DATA_PACKAGES = {
    "pack1": {
        "name": "数据接入套餐一",
        "price": {"cny": 15000, "usd": 2000},
        "detail": "20 个指标、600 万行/年、60 天存储",
    },
    "pack2": {
        "name": "数据接入套餐二",
        "price": {"cny": 30000, "usd": 4000},
        "detail": "50 个指标、1000 万行/年、120 天存储",
    },
    "pack3": {
        "name": "数据接入套餐三",
        "price": {"cny": 50000, "usd": 7000},
        "detail": "100 个指标、2000 万行/年、1 年存储",
    },
}

USAGE_META: dict[str, dict[str, Any]] = {
    "major_media": {
        "label": "大媒体渠道",
        "display_unit": "个",
        "billing_unit": "个大媒体/年",
        "price_key": "major_media",
        "billing_step": 1,
    },
    "monthly_ads_wan": {
        "label": "每月 Ad 创建额度",
        "display_unit": "万/月",
        "billing_unit": "1 万/月（年度）",
        "price_key": "monthly_ads_wan",
        "billing_step": 1,
    },
    "users": {
        "label": "用户",
        "display_unit": "人",
        "billing_unit": "人/年",
        "price_key": "users",
        "billing_step": 1,
    },
    "ad_accounts": {
        "label": "广告账户",
        "display_unit": "个",
        "billing_unit": "每 100 个/年",
        "price_key": "ad_accounts",
        "billing_step": 100,
    },
    "ai_rules": {
        "label": "AI 助手规则",
        "display_unit": "条",
        "billing_unit": "条/年",
        "price_key": "ai_rules",
        "billing_step": 1,
    },
    "scheduled_reports": {
        "label": "定时报表",
        "display_unit": "条",
        "billing_unit": "条/年",
        "price_key": "scheduled_reports",
        "billing_step": 1,
    },
    "storage_tb": {
        "label": "素材库容量",
        "display_unit": "T",
        "billing_unit": "T/年",
        "price_key": "storage_tb",
        "billing_step": 1,
    },
    "youtube_channels": {
        "label": "YouTube 频道",
        "display_unit": "个",
        "billing_unit": "个频道/年",
        "price_key": "youtube_channels",
        "billing_step": 1,
    },
    "sub_channel_apps": {
        "label": "子渠道报表应用",
        "display_unit": "个",
        "billing_unit": "个应用/年",
        "price_key": "sub_channel_apps",
        "billing_step": 1,
    },
}

DEDUCTIBLE_USAGE = tuple(USAGE_META)
FEATURE_LABELS = {
    "report_api": "标准 Report API",
    "attribution_api": "归因数据 API",
    "traffic_pool": "流量池",
}
MANUAL_ID_ALIASES = {
    "major_media": "major_media",
    "monthly_ads": "monthly_ads_wan",
    "monthly_ads_wan": "monthly_ads_wan",
    "non_expiring_ads": "non_expiring_ads_wan",
    "non_expiring_ads_wan": "non_expiring_ads_wan",
    "user": "users",
    "users": "users",
    "ad_account": "ad_accounts",
    "ad_accounts": "ad_accounts",
    "ai_rule": "ai_rules",
    "ai_rules": "ai_rules",
    "scheduled_report": "scheduled_reports",
    "scheduled_reports": "scheduled_reports",
    "storage": "storage_tb",
    "storage_tb": "storage_tb",
    "youtube_channel": "youtube_channels",
    "youtube_channels": "youtube_channels",
    "sub_channel_report": "sub_channel_apps",
    "sub_channel_apps": "sub_channel_apps",
    "trial": "trial_runs",
    "trial_runs": "trial_runs",
    "report_api": "report_api",
    "attribution_api": "attribution_api",
    "traffic_pool": "traffic_pool",
}


def pricing_source(currency: str) -> dict[str, str]:
    slug = "xmp_price_cny" if currency == "cny" else "xmp_price_usd"
    return {
        "url": f"https://help-xmp.mobvista.com/docs/{slug}",
        "basis": "官方活动优惠价（本 Skill 对外称套餐官方活动价）",
        "verified_on": PRICING_VERSION,
        "offer_valid_through": OFFER_VALID_THROUGH,
    }


def pricing_check_info(request: dict[str, Any]) -> dict[str, Any]:
    """Return the live-price verification metadata to carry into every result."""
    check = request.get("pricing_check") or {}
    checked_at = check.get("checked_at") or request.get("pricing_checked_at")
    if not checked_at:
        checked_at = datetime.now(ZoneInfo("Asia/Shanghai")).isoformat(timespec="seconds")
    return {
        "status": str(check.get("status") or ("timestamp_only" if request.get("pricing_checked_at") else "not_verified")),
        "checked_at": str(checked_at),
        "sources": check.get("sources") or [
            {"currency": "usd", "url": SOURCES_URL_USD},
            {"currency": "cny", "url": SOURCES_URL_CNY},
        ],
    }


def money(value: float | int | None, currency: str) -> str:
    if value is None:
        return "未提供"
    symbol = "¥" if currency == "cny" else "$"
    return f"{symbol}{round(value):,}"


def quantity_text(value: Any) -> str:
    if value is None:
        return "未提供"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return f"{value:g}" if isinstance(value, float) else str(value)


def quantity_with_unit(value: Any, unit: str) -> str:
    return "未提供" if value is None else f"{quantity_text(value)}{unit}"


def number(value: Any, field: str, default: float | None = None) -> float:
    if value is None and default is not None:
        return default
    if isinstance(value, bool):
        raise ValueError(f"{field} must be a non-negative number")
    try:
        parsed = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(f"{field} must be a non-negative number") from error
    if not math.isfinite(parsed) or parsed < 0:
        raise ValueError(f"{field} must be a non-negative number")
    return parsed


def component(
    item_id: str,
    label: str,
    requested: Any,
    included: Any,
    extra: Any,
    display_unit: str,
    billing_quantity: float,
    billing_unit: str,
    unit_price: float,
    detail: str,
    source: str = "官方活动价",
) -> dict[str, Any]:
    subtotal = round(billing_quantity * unit_price)
    return {
        "item_id": item_id,
        "label": label,
        "requested": requested,
        "included": included,
        "extra": extra,
        "display_unit": display_unit,
        "billing_quantity": billing_quantity,
        "billing_unit": billing_unit,
        "unit_price": round(unit_price),
        "subtotal": subtotal,
        "detail": detail,
        "source": source,
    }


def coverage_line(
    item_id: str,
    label: str,
    requested: Any,
    included: Any,
    extra: Any,
    display_unit: str,
    detail: str = "",
) -> dict[str, Any]:
    return {
        "item_id": item_id,
        "label": label,
        "requested": requested,
        "included": included,
        "extra": extra,
        "final_covered": (included or 0) + (extra or 0),
        "display_unit": display_unit,
        "detail": detail,
    }


def explicit_no_items(request: dict[str, Any]) -> set[str]:
    needs = request.get("needs") or {}
    result = {str(item) for item in (request.get("explicit_no") or [])}
    for key in ("report_api", "attribution_api", "traffic_pool"):
        if key in needs and needs[key] is False:
            result.add(key)
    if "trial_runs" in needs and number(needs["trial_runs"], "needs.trial_runs") == 0:
        result.add("trial_runs")
    return result


def feature_state(request: dict[str, Any], key: str) -> str:
    needs = request.get("needs") or {}
    if key in explicit_no_items(request):
        return "not_required"
    if key in needs and bool(needs[key]):
        return "required"
    return "unspecified"


def demand_summary(request: dict[str, Any]) -> dict[str, Any]:
    needs = request.get("needs") or {}
    locked_plan = request.get("locked_plan")
    summary: dict[str, Any] = {
        "locked_plan": PLANS.get(locked_plan, {}).get("name") if locked_plan else None,
        "major_media": None,
        "video_channels": None,
        "monthly_ad_creation_wan": None,
        "annual_ad_creation_wan_for_reference": None,
        "non_expiring_ad_creation_total_wan": None,
        "users": None,
        "ad_accounts": None,
        "features": {
            "report_api": feature_state(request, "report_api"),
            "attribution_api": feature_state(request, "attribution_api"),
            "traffic_pool": feature_state(request, "traffic_pool"),
            "trial_runs": feature_state(request, "trial_runs"),
        },
        "deduction_mode": str(request.get("deduction_mode") or "auto"),
    }
    field_map = {
        "major_media": "major_media",
        "video_channels": "video_channels",
        "monthly_ads_wan": "monthly_ad_creation_wan",
        "non_expiring_ads_wan": "non_expiring_ad_creation_total_wan",
        "users": "users",
        "ad_accounts": "ad_accounts",
    }
    for source_key, output_key in field_map.items():
        if source_key in needs:
            summary[output_key] = number(needs[source_key], f"needs.{source_key}")
    annual_key = "annual_ads_wan_for_reference" if "annual_ads_wan_for_reference" in needs else "annual_ads_wan"
    if annual_key in needs:
        summary["annual_ad_creation_wan_for_reference"] = number(needs[annual_key], f"needs.{annual_key}")
    if request.get("major_media_names"):
        summary["major_media_names"] = list(request["major_media_names"])
    if request.get("video_channel_names"):
        summary["video_channel_names"] = list(request["video_channel_names"])
    return summary


def evaluate_plan(plan_id: str, request: dict[str, Any], currency: str) -> dict[str, Any]:
    plan = PLANS[plan_id]
    needs = request.get("needs") or {}
    components: list[dict[str, Any]] = [
        component(
            "base_plan",
            f"{plan['name']}（套餐官方活动价）",
            1,
            0,
            1,
            "套",
            1,
            "套/年",
            plan["price"][currency],
            "年度套餐官方活动价",
            "套餐官方活动价",
        )
    ]
    coverage: list[dict[str, Any]] = []
    unavailable: list[str] = []

    advanced_required = any(bool(needs.get(key)) for key in ("auto_ad_creation", "creative_suite", "ai_video"))
    if advanced_required and not plan["features"]["advanced"]:
        unavailable.append("自动创建广告、素材编辑推送或 AI 视频需要高级版及以上")
    if bool(needs.get("diagnosis")) and not plan["features"]["diagnosis"]:
        unavailable.append("投放诊断仅 VIP 版提供")

    if "video_channels" in needs:
        requested_video = number(needs["video_channels"], "needs.video_channels")
        included_video = plan["included"]["video_channels"]
        extra_video = max(0, requested_video - included_video)
        coverage.append(
            coverage_line(
                "video_channels",
                "视频渠道",
                requested_video,
                included_video,
                extra_video,
                "个",
                "视频渠道不额外计费，只校验套餐容量",
            )
        )
        if requested_video > included_video:
            unavailable.append(f"视频渠道需求 {requested_video:g} 个超过套餐容量 {included_video} 个")

    for key, meta in USAGE_META.items():
        if key not in needs:
            continue
        requested = number(needs[key], f"needs.{key}")
        included = plan["included"][key]
        extra = max(0, requested - included)
        coverage.append(coverage_line(key, meta["label"], requested, included, extra, meta["display_unit"]))
        if extra <= 0:
            continue
        billing_quantity = math.ceil(extra / meta["billing_step"])
        price_key = meta["price_key"]
        if key == "ad_accounts" and bool(needs.get("high_frequency_accounts")):
            price_key = "ad_accounts_high"
        unit_price = ADDON_PRICE[price_key][currency]
        components.append(
            component(
                key,
                f"{meta['label']}增购",
                requested,
                included,
                extra,
                meta["display_unit"],
                billing_quantity,
                meta["billing_unit"],
                unit_price,
                f"需求 {requested:g}{meta['display_unit']} - 套餐已含 {included:g}{meta['display_unit']} = 净增购 {extra:g}{meta['display_unit']}",
            )
        )

    if "non_expiring_ads_wan" in needs:
        requested_total = number(needs["non_expiring_ads_wan"], "needs.non_expiring_ads_wan")
        coverage.append(
            coverage_line(
                "non_expiring_ads_wan",
                "不过期 Ad 创建总额度",
                requested_total,
                0,
                requested_total,
                "万",
                "独立总量池，不与每月 Ad 创建额度互抵",
            )
        )
        if requested_total > 0:
            billing_quantity = math.ceil(requested_total)
            components.append(
                component(
                    "non_expiring_ads_wan",
                    "不过期 Ad 创建总额度",
                    requested_total,
                    0,
                    requested_total,
                    "万",
                    billing_quantity,
                    "1 万个不过期 Ad",
                    ADDON_PRICE["non_expiring_ads_wan"][currency],
                    f"客户需要 {requested_total:g} 万，不过期且不按月重置",
                )
            )

    for key in ("report_api", "attribution_api"):
        if key not in needs or not bool(needs[key]):
            continue
        included = 1 if plan["features"][key] else 0
        extra = 0 if included else 1
        coverage.append(coverage_line(key, FEATURE_LABELS[key], 1, included, extra, "项"))
        if extra:
            components.append(
                component(
                    key,
                    FEATURE_LABELS[key],
                    1,
                    0,
                    1,
                    "项",
                    1,
                    "项/年",
                    ADDON_PRICE[key][currency],
                    "套餐未含，按年加购",
                )
            )

    included_trials = plan["included"]["trial_runs"]
    if bool(needs.get("traffic_pool")):
        included_pool = 1 if plan["features"]["traffic_pool"] else 0
        pool_extra = 0 if included_pool else 1
        coverage.append(coverage_line("traffic_pool", "流量池", 1, included_pool, pool_extra, "项"))
        if pool_extra:
            components.append(
                component(
                    "traffic_pool",
                    "流量池",
                    1,
                    0,
                    1,
                    "项",
                    1,
                    "项/年",
                    FLOW_PRICE[plan_id][currency],
                    f"{plan['name']}流量池加购，附赠 10 次 Mintegral 一键试新",
                )
            )
            included_trials += 10

    if "trial_runs" in needs:
        requested_trials = number(needs["trial_runs"], "needs.trial_runs")
        extra_trials = max(0, requested_trials - included_trials)
        coverage.append(
            coverage_line(
                "trial_runs",
                "Mintegral 一键试新",
                requested_trials,
                included_trials,
                extra_trials,
                "次",
            )
        )
        if extra_trials > 0:
            billing_quantity = math.ceil(extra_trials)
            components.append(
                component(
                    "trial_runs",
                    "Mintegral 一键试新",
                    requested_trials,
                    included_trials,
                    extra_trials,
                    "次",
                    billing_quantity,
                    "次/年",
                    ADDON_PRICE["trial_runs"][currency],
                    f"需求 {requested_trials:g} 次 - 已含/附赠 {included_trials:g} 次 = 增购 {extra_trials:g} 次",
                )
            )

    if bool(needs.get("high_frequency_ai")):
        surcharge = plan["price"][currency] * 0.5
        components.append(
            component(
                "high_frequency_ai",
                "高频 AI 助手与数据更新",
                1,
                0,
                1,
                "项",
                1,
                "套餐加价项/年",
                surcharge,
                "套餐官方活动价总额按 1.5 倍计费，本行列示额外 50%",
            )
        )

    data_package = str(needs.get("data_package") or "none")
    if data_package != "none" and data_package not in DATA_PACKAGES:
        unavailable.append("数据接入套餐必须为 pack1、pack2 或 pack3")
    elif data_package in DATA_PACKAGES:
        item = DATA_PACKAGES[data_package]
        components.append(
            component(
                "data_package",
                item["name"],
                1,
                0,
                1,
                "套",
                1,
                "套/年",
                item["price"][currency],
                item["detail"],
            )
        )

    original_total = sum(item["subtotal"] for item in components)
    return {
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "rank": plan["rank"],
        "eligible": not unavailable,
        "unavailable_reasons": unavailable,
        "components": components,
        "coverage": coverage,
        "base_activity_price": plan["price"][currency],
        "addon_total": round(original_total - plan["price"][currency]),
        "original_activity_total": round(original_total),
        "addon_count": max(0, len(components) - 1),
    }


def deduction_line(
    item_id: str,
    label: str,
    requested: Any,
    included: Any,
    unused: Any,
    display_unit: str,
    billing_quantity: float,
    billing_unit: str,
    unit_price: float,
    detail: str,
    reason: str,
    mode: str,
    source_requirement: str,
) -> dict[str, Any]:
    line = component(
        item_id,
        label,
        requested,
        included,
        unused,
        display_unit,
        billing_quantity,
        billing_unit,
        unit_price,
        detail,
        "同项官方活动加购价反向核算",
    )
    line.update(
        {
            "unused": unused,
            "reason": reason,
            "mode": mode,
            "source_requirement": source_requirement,
        }
    )
    return line


def create_deductions(
    selected: dict[str, Any], request: dict[str, Any], currency: str
) -> tuple[list[dict[str, Any]], list[str]]:
    if str(request.get("deduction_mode") or "auto") == "none":
        return [], []

    plan = PLANS[selected["plan_id"]]
    needs = request.get("needs") or {}
    explicit_no = explicit_no_items(request)
    deductions: list[dict[str, Any]] = []
    warnings: list[str] = []
    deducted_ids: set[str] = set()

    for key in DEDUCTIBLE_USAGE:
        if key not in needs:
            continue
        requested = number(needs[key], f"needs.{key}")
        included = plan["included"][key]
        unused = max(0, included - requested)
        if unused <= 0:
            continue
        meta = USAGE_META[key]
        billing_quantity = math.floor(unused / meta["billing_step"])
        if billing_quantity <= 0:
            continue
        price_key = meta["price_key"]
        if key == "ad_accounts" and bool(needs.get("high_frequency_accounts")):
            price_key = "ad_accounts_high"
        deductions.append(
            deduction_line(
                key,
                f"未使用{meta['label']}额度",
                requested,
                included,
                unused,
                meta["display_unit"],
                billing_quantity,
                meta["billing_unit"],
                ADDON_PRICE[price_key][currency],
                f"套餐已含 {included:g}{meta['display_unit']} - 明确需求 {requested:g}{meta['display_unit']} = 未使用 {unused:g}{meta['display_unit']}",
                "客户明确需求低于套餐内含额度",
                "auto",
                f"needs.{key}",
            )
        )
        deducted_ids.add(key)

    for key in ("report_api", "attribution_api"):
        if key in explicit_no and plan["features"][key]:
            deductions.append(
                deduction_line(
                    key,
                    FEATURE_LABELS[key],
                    0,
                    1,
                    1,
                    "项",
                    1,
                    "项/年",
                    ADDON_PRICE[key][currency],
                    "客户明确不要，套餐内含 1 项",
                    "客户明确不要套餐内含权益",
                    "auto",
                    f"explicit_no.{key}",
                )
            )
            deducted_ids.add(key)

    if ("trial_runs" in explicit_no or "trial_runs" in needs) and plan["included"]["trial_runs"] > 0:
        requested_trials = 0 if "trial_runs" in explicit_no else number(needs["trial_runs"], "needs.trial_runs")
        unused_trials = max(0, plan["included"]["trial_runs"] - requested_trials)
        if unused_trials > 0:
            deductions.append(
                deduction_line(
                    "trial_runs",
                    "Mintegral 一键试新",
                    requested_trials,
                    plan["included"]["trial_runs"],
                    unused_trials,
                    "次",
                    math.floor(unused_trials),
                    "次/年",
                    ADDON_PRICE["trial_runs"][currency],
                    f"套餐已含 {plan['included']['trial_runs']} 次 - 明确需求 {requested_trials:g} 次 = 未使用 {unused_trials:g} 次",
                    "客户明确不要或明确需求低于套餐内含次数",
                    "auto",
                    "explicit_no.trial_runs" if "trial_runs" in explicit_no else "needs.trial_runs",
                )
            )
            deducted_ids.add("trial_runs")

    if "traffic_pool" in explicit_no and plan["features"]["traffic_pool"]:
        warnings.append("VIP 版内含流量池没有官方独立扣减价格，未自动生成减去项")

    for index, raw_item in enumerate(request.get("manual_deductions") or []):
        raw_id = str(raw_item.get("id") or "")
        item_id = MANUAL_ID_ALIASES.get(raw_id, raw_id)
        if item_id == "non_expiring_ads_wan":
            warnings.append("不过期 Ad 创建总额度不能作为减去项，已忽略该手动调整")
            continue
        if item_id in deducted_ids:
            warnings.append(f"{item_id} 已有自动减去项，为避免重复扣减，已忽略同项手动调整")
            continue
        requested_quantity = number(raw_item.get("quantity"), f"manual_deductions[{index}].quantity")
        if requested_quantity <= 0:
            warnings.append(f"手动减去项 {item_id or index} 的数量必须大于 0，已忽略")
            continue

        if item_id in USAGE_META:
            meta = USAGE_META[item_id]
            billing_quantity = math.ceil(requested_quantity / meta["billing_step"])
            price_key = meta["price_key"]
            if item_id == "ad_accounts" and bool(needs.get("high_frequency_accounts")):
                price_key = "ad_accounts_high"
            unit_price = ADDON_PRICE[price_key][currency]
            included = plan["included"][item_id]
            available = next(
                (line["final_covered"] for line in selected["coverage"] if line["item_id"] == item_id),
                included,
            )
            if requested_quantity > available:
                warnings.append(
                    f"手动减去 {meta['label']} {requested_quantity:g}{meta['display_unit']} 超过当前方案覆盖的 {available:g}{meta['display_unit']}，请人工复核"
                )
            deductions.append(
                deduction_line(
                    item_id,
                    str(raw_item.get("label") or f"手动扣减{meta['label']}"),
                    None,
                    available,
                    requested_quantity,
                    meta["display_unit"],
                    billing_quantity,
                    meta["billing_unit"],
                    unit_price,
                    f"手动扣减 {requested_quantity:g}{meta['display_unit']}，按 {billing_quantity:g} 个计价单位核算",
                    str(raw_item.get("reason") or "商务手动调整"),
                    "manual",
                    f"manual_deductions[{index}]",
                )
            )
        elif item_id in ("report_api", "attribution_api", "trial_runs"):
            label = FEATURE_LABELS.get(item_id, "Mintegral 一键试新")
            unit = "项" if item_id != "trial_runs" else "次"
            billing_quantity = math.ceil(requested_quantity)
            deductions.append(
                deduction_line(
                    item_id,
                    str(raw_item.get("label") or f"手动扣减{label}"),
                    None,
                    None,
                    requested_quantity,
                    unit,
                    billing_quantity,
                    f"{unit}/年",
                    ADDON_PRICE[item_id][currency],
                    f"手动扣减 {requested_quantity:g}{unit}",
                    str(raw_item.get("reason") or "商务手动调整"),
                    "manual",
                    f"manual_deductions[{index}]",
                )
            )
        elif item_id == "traffic_pool":
            unit_price = FLOW_PRICE[selected["plan_id"]][currency]
            if unit_price <= 0:
                warnings.append("当前套餐的流量池没有独立可扣价格，已忽略该手动调整")
                continue
            deductions.append(
                deduction_line(
                    item_id,
                    str(raw_item.get("label") or "手动扣减流量池"),
                    None,
                    None,
                    requested_quantity,
                    "项",
                    math.ceil(requested_quantity),
                    "项/年",
                    unit_price,
                    f"手动扣减 {requested_quantity:g} 项",
                    str(raw_item.get("reason") or "商务手动调整"),
                    "manual",
                    f"manual_deductions[{index}]",
                )
            )
        else:
            warnings.append(f"未知减去项 {raw_id or item_id}，已忽略")

    return deductions, warnings


def annual_ads_value(needs: dict[str, Any]) -> float | None:
    if "annual_ads_wan_for_reference" in needs:
        return number(needs["annual_ads_wan_for_reference"], "needs.annual_ads_wan_for_reference")
    if "annual_ads_wan" in needs:
        return number(needs["annual_ads_wan"], "needs.annual_ads_wan")
    return None


def plan_comparison(candidates: list[dict[str, Any]], selected: dict[str, Any] | None) -> list[dict[str, Any]]:
    benchmark = selected["original_activity_total"] if selected else None
    return [
        {
            "plan_id": item["plan_id"],
            "plan": item["plan_name"],
            "eligible": item["eligible"],
            "unavailable_reasons": item["unavailable_reasons"],
            "base_activity_price": item["base_activity_price"],
            "addon_total": item["addon_total"],
            "original_activity_total": item["original_activity_total"],
            "difference_from_selected": item["original_activity_total"] - benchmark if benchmark is not None else None,
            "selected": bool(selected and item["plan_id"] == selected["plan_id"]),
        }
        for item in candidates
    ]


def incomplete_result(
    request: dict[str, Any],
    currency: str,
    status: str,
    warnings: list[str],
    required_questions: list[str],
    comparisons: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    check_info = pricing_check_info(request)
    return {
        "status": status,
        "recommended_plan": None,
        "recommended_plan_id": None,
        "automatic_recommendation": None,
        "recommendation_mode": "automatic",
        "currency": currency.upper(),
        "demand_summary": demand_summary(request),
        "actual_quote": None,
        "suggested_quote": None,
        "final_discount": None,
        "original_activity_total": None,
        "deduction_total": None,
        "adjusted_activity_total": None,
        "recommended_price_90": None,
        "minimum_price_60": None,
        "components": [],
        "deductions": [],
        "coverage": [],
        "quota_summary": {
            "monthly_ad_creation": {
                "included_wan_per_month": None,
                "requested_wan_per_month": None,
                "additional_wan_per_month": None,
                "final_wan_per_month": None,
            },
            "non_expiring_ad_creation_total": {
                "included_wan": 0,
                "requested_wan": None,
                "additional_wan": None,
                "final_wan": None,
            },
        },
        "calculation_trace": [],
        "plan_comparison": comparisons or [],
        "recommendation_reason": "关键输入未确认，暂不生成正式报价。",
        "warnings": warnings,
        "required_questions": required_questions,
        "pricing_source": pricing_source(currency),
        "pricing_version": PRICING_VERSION,
        "pricing_check_status": check_info["status"],
        "pricing_checked_at": check_info["checked_at"],
        "pricing_check_sources": check_info["sources"],
    }


def calculate(request: dict[str, Any]) -> dict[str, Any]:
    currency = str(request.get("currency") or "").lower()
    if currency not in {"cny", "usd"}:
        raise ValueError("currency must be cny or usd")
    check_info = pricing_check_info(request)
    locked_plan = request.get("locked_plan")
    if locked_plan is not None and locked_plan not in PLANS:
        raise ValueError("locked_plan must be basic, advanced, pro or vip")
    deduction_mode = str(request.get("deduction_mode") or "auto")
    if deduction_mode not in {"auto", "none"}:
        raise ValueError("deduction_mode must be auto or none")

    needs = request.get("needs") or {}
    annual_ads = annual_ads_value(needs)
    if annual_ads is not None and "monthly_ads_wan" not in needs:
        return incomplete_result(
            request,
            currency,
            "needs_clarification",
            ["仅提供全年 Ad 创建量，无法据此确定每月峰值额度。"],
            ["请确认每月 Ad 创建额度或最高月份峰值是多少万/月？"],
        )

    candidates = [evaluate_plan(plan_id, request, currency) for plan_id in PLAN_ORDER]
    eligible = sorted(
        (candidate for candidate in candidates if candidate["eligible"]),
        key=lambda item: (item["original_activity_total"], item["addon_count"], item["rank"]),
    )
    if not eligible and not locked_plan:
        return incomplete_result(
            request,
            currency,
            "needs_manual_quote",
            ["四档标准套餐均无法完整满足需求。"],
            ["请确认是否进入定制报价及超出标准套餐的能力处理方式。"],
            plan_comparison(candidates, None),
        )

    automatic = eligible[0] if eligible else None
    if locked_plan:
        selected = next(item for item in candidates if item["plan_id"] == locked_plan)
        recommendation_mode = "user_specified"
    else:
        selected = automatic
        recommendation_mode = "automatic"
    if selected is None:
        raise ValueError("no selectable plan")

    deductions, warnings = create_deductions(selected, request, currency)
    if locked_plan and not selected["eligible"]:
        warnings.append("用户指定套餐不能完整满足需求，本结果仅为指定套餐模拟，不应直接作为正式报价")
    if annual_ads is not None:
        monthly_ads = number(needs["monthly_ads_wan"], "needs.monthly_ads_wan")
        if not math.isclose(annual_ads, monthly_ads * 12, rel_tol=0, abs_tol=0.001):
            warnings.append(
                f"全年 Ad 创建量 {annual_ads:g} 万与每月额度 {monthly_ads:g} 万/月 × 12 不一致，请确认是否存在峰谷差异"
            )

    deduction_total = round(sum(item["subtotal"] for item in deductions))
    adjusted_total = max(0, selected["original_activity_total"] - deduction_total)
    if deduction_total > selected["original_activity_total"]:
        warnings.append("减去项合计超过原活动价总价值，调整后活动价已限制为 0，请人工复核")
    recommended_price = round(adjusted_total * 0.9)
    minimum_price = round(adjusted_total * 0.6)

    actual_quote: int | None = None
    if request.get("actual_quote") is not None:
        actual_quote = round(number(request["actual_quote"], "actual_quote"))
    quote_for_discount = actual_quote if actual_quote is not None else recommended_price
    final_discount = round(quote_for_discount / adjusted_total * 10, 2) if adjusted_total else None
    if actual_quote is not None and actual_quote < minimum_price:
        warnings.append("实际报价低于 6 折最低价，需要额外审批")

    if recommendation_mode == "user_specified":
        automatic_name = automatic["plan_name"] if automatic else "无可用标准套餐"
        reason = f"按用户指定模拟 {selected['plan_name']}；按原活动价自动推荐结果为 {automatic_name}。"
    elif len(eligible) > 1:
        runner_up = eligible[1]
        saving = runner_up["original_activity_total"] - selected["original_activity_total"]
        reason = f"{selected['plan_name']}满足全部需求，原活动价总价值比次优方案 {runner_up['plan_name']} 低 {money(saving, currency)}。"
    else:
        reason = f"{selected['plan_name']}是唯一满足全部能力的标准套餐。"

    monthly_coverage = next(
        (item for item in selected["coverage"] if item["item_id"] == "monthly_ads_wan"), None
    )
    non_expiring_coverage = next(
        (item for item in selected["coverage"] if item["item_id"] == "non_expiring_ads_wan"), None
    )
    monthly_requested = monthly_coverage["requested"] if monthly_coverage else None
    non_expiring_requested = non_expiring_coverage["requested"] if non_expiring_coverage else None
    quota_summary = {
        "monthly_ad_creation": {
            "included_wan_per_month": PLANS[selected["plan_id"]]["included"]["monthly_ads_wan"],
            "requested_wan_per_month": monthly_requested,
            "additional_wan_per_month": monthly_coverage["extra"] if monthly_coverage else None,
            "final_wan_per_month": monthly_requested,
        },
        "non_expiring_ad_creation_total": {
            "included_wan": 0,
            "requested_wan": non_expiring_requested,
            "additional_wan": non_expiring_coverage["extra"] if non_expiring_coverage else None,
            "final_wan": non_expiring_requested,
        },
    }

    quoted_label = "实际报价" if actual_quote is not None else "建议报价"
    trace = [
        f"原活动价总价值 = 套餐官方活动价 {money(selected['base_activity_price'], currency)} + 必要加购 {money(selected['addon_total'], currency)} = {money(selected['original_activity_total'], currency)}",
        f"调整后活动价 = max(0, {money(selected['original_activity_total'], currency)} - {money(deduction_total, currency)}) = {money(adjusted_total, currency)}",
        f"9 折推荐价 = {money(adjusted_total, currency)} × 90% = {money(recommended_price, currency)}",
        f"6 折最低价 = {money(adjusted_total, currency)} × 60% = {money(minimum_price, currency)}",
    ]
    if final_discount is not None:
        trace.append(
            f"最终核算折扣 = {quoted_label} {money(quote_for_discount, currency)} ÷ 调整后活动价 {money(adjusted_total, currency)} × 10 = {final_discount:.2f} 折"
        )

    return {
        "status": "ok" if selected["eligible"] else "simulation_ineligible",
        "recommended_plan": selected["plan_name"],
        "recommended_plan_id": selected["plan_id"],
        "automatic_recommendation": automatic["plan_name"] if automatic else None,
        "recommendation_mode": recommendation_mode,
        "currency": currency.upper(),
        "demand_summary": demand_summary(request),
        "actual_quote": actual_quote,
        "suggested_quote": recommended_price,
        "final_discount": final_discount,
        "original_activity_total": selected["original_activity_total"],
        "deduction_total": deduction_total,
        "adjusted_activity_total": round(adjusted_total),
        "recommended_price_90": recommended_price,
        "minimum_price_60": minimum_price,
        "components": selected["components"],
        "deductions": deductions,
        "coverage": selected["coverage"],
        "quota_summary": quota_summary,
        "calculation_trace": trace,
        "plan_comparison": plan_comparison(candidates, selected),
        "recommendation_reason": reason,
        "warnings": warnings,
        "required_questions": [],
        "pricing_source": pricing_source(currency),
        "pricing_version": PRICING_VERSION,
        "pricing_check_status": check_info["status"],
        "pricing_checked_at": check_info["checked_at"],
        "pricing_check_sources": check_info["sources"],
    }


def render_demand(summary: dict[str, Any]) -> list[str]:
    feature_labels = {
        "required": "需要",
        "not_required": "明确不要",
        "unspecified": "未提供",
    }
    lines = [
        f"- 指定套餐：{summary['locked_plan'] or '未指定，自动推荐'}",
        f"- 大媒体：{quantity_with_unit(summary['major_media'], ' 个')}",
        f"- 视频渠道：{quantity_with_unit(summary['video_channels'], ' 个')}",
        f"- 每月 Ad 创建额度：{quantity_with_unit(summary['monthly_ad_creation_wan'], ' 万/月')}",
        f"- 全年 Ad 创建量（仅校验）：{quantity_with_unit(summary['annual_ad_creation_wan_for_reference'], ' 万')}",
        f"- 不过期 Ad 创建总额度：{quantity_with_unit(summary['non_expiring_ad_creation_total_wan'], ' 万')}",
        f"- 用户：{quantity_with_unit(summary['users'], ' 人')}",
        f"- 广告账户：{quantity_with_unit(summary['ad_accounts'], ' 个')}",
        f"- 标准 Report API：{feature_labels[summary['features']['report_api']]}",
        f"- 归因数据 API：{feature_labels[summary['features']['attribution_api']]}",
        f"- 流量池：{feature_labels[summary['features']['traffic_pool']]}",
        f"- Mintegral 一键试新：{feature_labels[summary['features']['trial_runs']]}",
        f"- 减去项模式：{'自动核算' if summary['deduction_mode'] == 'auto' else '不做减去项'}",
    ]
    return lines


def render_markdown(result: dict[str, Any]) -> str:
    currency = result["currency"].lower()
    if result["status"] in {"needs_clarification", "needs_manual_quote"}:
        lines = ["# 报价测算待确认", "", "## 需求识别", ""]
        lines.extend(render_demand(result["demand_summary"]))
        lines.extend(["", "## 必须确认", ""])
        lines.extend(f"- {question}" for question in result["required_questions"])
        if result["warnings"]:
            lines.extend(["", "## 风险与待确认项", ""])
            lines.extend(f"- {warning}" for warning in result["warnings"])
        lines.extend(
            [
                "",
                "## 价格来源",
                "",
                f"- 官方报价：{result['pricing_source']['url']}",
                f"- 价格版本：{result['pricing_version']}",
                f"- 本次报价单检查时间：{result['pricing_checked_at']}",
                f"- 报价单检查状态：{result['pricing_check_status']}",
                "- 关键输入确认前不输出正式推荐套餐、原活动价、9 折推荐价或 6 折最低价。",
            ]
        )
        return "\n".join(lines)

    quoted_amount = result["actual_quote"] if result["actual_quote"] is not None else result["suggested_quote"]
    quoted_label = "实际报价金额" if result["actual_quote"] is not None else "建议实际报价金额"
    discount_text = f"{result['final_discount']:.2f} 折" if result["final_discount"] is not None else "无法计算"
    discount_label = "当前报价相对调整后活动价折扣" if result["actual_quote"] is not None else "建议报价相对调整后活动价折扣"
    mode_label = "指定套餐模拟" if result["recommendation_mode"] == "user_specified" else "自动推荐"
    lines = [
        "# 报价测算结果",
        "",
        f"- **推荐套餐：** {result['recommended_plan']}（{mode_label}）",
        f"- **{discount_label}：** {discount_text}",
        f"- **{quoted_label}：** {money(quoted_amount, currency)}",
        f"- **原活动价总价值：** {money(result['original_activity_total'], currency)}",
        f"- **减去项合计：** −{money(result['deduction_total'], currency)}",
        f"- **调整后活动价：** {money(result['adjusted_activity_total'], currency)}",
        f"- **9 折推荐价：** {money(result['recommended_price_90'], currency)}",
        f"- **6 折最低价：** {money(result['minimum_price_60'], currency)}",
        f"- **币种：** {result['currency']}",
        "",
        "## 需求识别",
        "",
    ]
    lines.extend(render_demand(result["demand_summary"]))
    lines.extend(["", "## 推荐说明", "", result["recommendation_reason"], "", "## 正负报价构成", ""])

    for item in result["components"]:
        lines.append(
            f"- `+` {item['label']}：{item['detail']}；计价 {quantity_text(item['billing_quantity'])} × {money(item['unit_price'], currency)}/{item['billing_unit']} = **{money(item['subtotal'], currency)}**"
        )
    if result["deductions"]:
        for item in result["deductions"]:
            lines.append(
                f"- `−` {item['label']}：{item['detail']}；计价 {quantity_text(item['billing_quantity'])} × {money(item['unit_price'], currency)}/{item['billing_unit']} = **−{money(item['subtotal'], currency)}**（{'自动' if item['mode'] == 'auto' else '手动'}）"
            )
    else:
        lines.append("- `−` 减去项：无")

    lines.extend(["", "## 计算推演", ""])
    lines.extend(f"- `{trace}`" for trace in result["calculation_trace"])

    monthly = result["quota_summary"]["monthly_ad_creation"]
    non_expiring = result["quota_summary"]["non_expiring_ad_creation_total"]
    lines.extend(
        [
            "",
            "## Ad 创建额度汇总",
            "",
            f"- 套餐每月 Ad 创建额度：{quantity_with_unit(monthly['included_wan_per_month'], ' 万/月')}",
            f"- 客户每月需求：{quantity_with_unit(monthly['requested_wan_per_month'], ' 万/月')}",
            f"- 每月额度增购：{quantity_with_unit(monthly['additional_wan_per_month'], ' 万/月')}",
            f"- 最终每月 Ad 创建额度：{quantity_with_unit(monthly['final_wan_per_month'], ' 万/月')}",
            f"- 客户不过期 Ad 创建总额度需求：{quantity_with_unit(non_expiring['requested_wan'], ' 万')}",
            f"- 不过期 Ad 创建总额度增购：{quantity_with_unit(non_expiring['additional_wan'], ' 万')}",
            f"- 最终不过期 Ad 创建总额度：{quantity_with_unit(non_expiring['final_wan'], ' 万')}",
            "",
            "## 套餐额度抵扣",
            "",
        ]
    )
    if result["coverage"]:
        for item in result["coverage"]:
            lines.append(
                f"- {item['label']}：需求 {quantity_text(item['requested'])}{item['display_unit']} − 已含 {quantity_text(item['included'])}{item['display_unit']} = 净增购 {quantity_text(item['extra'])}{item['display_unit']}"
            )
    else:
        lines.append("- 无明确数量型需求")

    lines.extend(
        [
            "",
            "## 四档套餐对比",
            "",
            "| 套餐 | 是否满足 | 套餐官方活动价 | 必要加购 | 原活动价总价值 | 与选中方案差额 |",
            "|---|---:|---:|---:|---:|---:|",
        ]
    )
    for item in result["plan_comparison"]:
        status = "是" if item["eligible"] else "否"
        lines.append(
            f"| {item['plan']} | {status} | {money(item['base_activity_price'], currency)} | {money(item['addon_total'], currency)} | {money(item['original_activity_total'], currency)} | {money(item['difference_from_selected'], currency)} |"
        )
        if item["unavailable_reasons"]:
            lines.append(f"| ↳ 缺口 |  |  |  | {'；'.join(item['unavailable_reasons'])} |  |")

    if result["warnings"]:
        lines.extend(["", "## 风险与待确认项", ""])
        lines.extend(f"- {warning}" for warning in result["warnings"])
    lines.extend(
        [
            "",
            "## 价格来源",
            "",
            f"- 口径：{result['pricing_source']['basis']}，币种 {result['currency']}",
            f"- 官方报价：{result['pricing_source']['url']}",
            f"- 价格版本/核验日期：{result['pricing_version']}",
            f"- 本次报价单检查时间：{result['pricing_checked_at']}",
            f"- 报价单检查状态：{result['pricing_check_status']}",
            f"- 当前活动价有效期：截至 {result['pricing_source']['offer_valid_through']}，到期后需重新核验",
            "- 内部规则：只有大媒体产生渠道加购费用；视频渠道不额外收费但需满足套餐容量。",
        ]
    )
    return "\n".join(lines)


def load_request(args: argparse.Namespace) -> dict[str, Any]:
    if args.json:
        return json.loads(args.json)
    if args.input:
        return json.loads(Path(args.input).read_text(encoding="utf-8"))
    return json.load(sys.stdin)


def main() -> int:
    parser = argparse.ArgumentParser(description="Calculate an XMP business quote")
    parser.add_argument("--input", help="Path to a JSON request file")
    parser.add_argument("--json", help="Inline JSON request")
    parser.add_argument("--format", choices=("json", "markdown"), default="json")
    parser.add_argument(
        "--pricing-check",
        help="JSON produced by scripts/check_pricing.py; required for a formal quote",
    )
    parser.add_argument(
        "--allow-unverified",
        action="store_true",
        help="Development/test escape hatch; do not use for a formal quote",
    )
    args = parser.parse_args()
    try:
        request = load_request(args)
        if args.pricing_check:
            check = json.loads(Path(args.pricing_check).read_text(encoding="utf-8"))
            if check.get("status") != "verified":
                raise ValueError("live pricing check is not verified; update the pricing snapshot before quoting")
            request["pricing_check"] = check
        elif not args.allow_unverified:
            raise ValueError(
                "formal quotes require a live pricing check; run check_pricing.py --strict first and pass --pricing-check"
            )
        result = calculate(request)
    except (ValueError, TypeError, json.JSONDecodeError) as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 2
    if args.format == "markdown":
        print(render_markdown(result))
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
