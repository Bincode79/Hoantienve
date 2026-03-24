#!/bin/bash
# =============================================================================
# aaPanel Installation Script for HoanTienVe365
# =============================================================================
# Usage: Run as root on a fresh VPS
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "   aaPanel Installation Script"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Lỗi: Vui lòng chạy với quyền root${NC}"
    echo "Cách chạy: sudo bash install_aapanel.sh"
    exit 1
fi

echo -e "${BLUE}[1/5] Cập nhật hệ thống...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y

echo -e "${BLUE}[2/5] Cài đặt packages cần thiết...${NC}"
apt install -y curl wget git unzip sudo

echo -e "${BLUE}[3/5] Tải aaPanel...${NC}"
cd /tmp
curl -sSO https://www.aapanel.com/install/install_6.0.sh

echo ""
echo "=============================================="
echo -e "${YELLOW}Đang cài aaPanel, vui lòng đợi...${NC}"
echo "=============================================="
echo ""

echo -e "${BLUE}[4/5] Cài aaPanel (chế độ tự động)...${NC}"
echo "y" | bash install_6.0.sh

echo -e "${BLUE}[5/5] Hoàn tất!${NC}"

echo ""
echo "=============================================="
echo -e "${GREEN}✅ CÀI ĐẶT HOÀN TẤT!${NC}"
echo "=============================================="
echo ""
echo "Truy cập aaPanel:"
echo ""
echo "  1. Mở trình duyệt"
echo "  2. Truy cập: http://YOUR_VPS_IP:7800"
echo ""
echo "Thông tin đăng nhập (hiển thị khi cài xong):"
echo "  - Username: [được tạo tự động]"
echo "  3. Password: [được tạo tự động]"
echo ""
echo "=============================================="
echo ""
