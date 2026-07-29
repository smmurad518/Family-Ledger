import 'package:flutter/material.dart';

class CurvedNavBar extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<CurvedNavItem> items;
  final Color backgroundColor;
  final Color activeColor;
  final Color inactiveColor;
  final Color borderColor;

  const CurvedNavBar({
    Key? key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    required this.backgroundColor,
    required this.activeColor,
    required this.inactiveColor,
    required this.borderColor,
  }) : super(key: key);

  @override
  State<CurvedNavBar> createState() => _CurvedNavBarState();
}

class _CurvedNavBarState extends State<CurvedNavBar> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  int _lastIndex = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _animation = Tween<double>(begin: 0.0, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _updateAnimation();
  }

  @override
  void didUpdateWidget(covariant CurvedNavBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      _lastIndex = oldWidget.currentIndex;
      _updateAnimation();
    }
  }

  void _updateAnimation() {
    final double endVal = widget.currentIndex.toDouble();
    _animation = Tween<double>(
      begin: _animation.value,
      end: endVal,
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward(from: 0.0);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Size size = MediaQuery.of(context).size;
    final double itemWidth = size.width / widget.items.length;

    return Container(
      height: 75,
      color: Colors.transparent,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Background Painter with cutout
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              final double activeX = (_animation.value + 0.5) * itemWidth;
              return CustomPaint(
                size: Size(size.width, 75),
                painter: _NavPainter(
                  activeX: activeX,
                  backgroundColor: widget.backgroundColor,
                  borderColor: widget.borderColor,
                ),
              );
            },
          ),
          // Interactive Nav Icons
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(widget.items.length, (index) {
                final item = widget.items[index];
                final isSelected = index == widget.currentIndex;

                // Active index shows floating icon, which we position separately
                if (isSelected) {
                  return SizedBox(width: itemWidth);
                }

                return GestureDetector(
                  onTap: () => widget.onTap(index),
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: itemWidth,
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          color: widget.inactiveColor,
                          size: 22,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          item.label,
                          style: TextStyle(
                            color: widget.inactiveColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          // Floating Active Icon Container
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              final double activeX = (_animation.value + 0.5) * itemWidth;
              final activeItem = widget.items[widget.currentIndex];
              return Positioned(
                left: activeX - 25,
                top: -12, // Float slightly above the nav bar
                child: GestureDetector(
                  onTap: () => widget.onTap(widget.currentIndex),
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: widget.activeColor,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: widget.activeColor.withOpacity(0.4),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      activeItem.icon,
                      color: Colors.black, // Dark text/icon inside floating bubble
                      size: 24,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class CurvedNavItem {
  final IconData icon;
  final String label;

  CurvedNavItem({required this.icon, required this.label});
}

class _NavPainter extends CustomPainter {
  final double activeX;
  final Color backgroundColor;
  final Color borderColor;

  _NavPainter({
    required this.activeX,
    required this.backgroundColor,
    required this.borderColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final path = Path();
    path.moveTo(0, 10);
    
    // Draw left flat part, curve dip down around activeX, then right flat part
    path.lineTo(activeX - 45, 10);
    
    path.cubicTo(
      activeX - 25, 10,
      activeX - 22, 38,
      activeX, 38,
    );
    
    path.cubicTo(
      activeX + 22, 38,
      activeX + 25, 10,
      activeX + 45, 10,
    );
    
    path.lineTo(size.width, 10);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    // Draw the background fill
    canvas.drawPath(path, paint);

    // Draw the top border line
    final borderPath = Path()
      ..moveTo(0, 10)
      ..lineTo(activeX - 45, 10)
      ..cubicTo(activeX - 25, 10, activeX - 22, 38, activeX, 38)
      ..cubicTo(activeX + 22, 38, activeX + 25, 10, activeX + 45, 10)
      ..lineTo(size.width, 10);
    
    canvas.drawPath(borderPath, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _NavPainter oldDelegate) {
    return oldDelegate.activeX != activeX ||
        oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.borderColor != borderColor;
  }
}
