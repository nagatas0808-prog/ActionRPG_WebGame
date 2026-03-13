import sys
import math
from PIL import Image
from collections import Counter

def process_sprite(src, dest, expected_cols):
    try:
        img = Image.open(src).convert("RGBA")
    except Exception as e:
        print(f"Failed to open image: {e}")
        return

    import builtins
    width: int = builtins.int(img.size[0])
    height: int = builtins.int(img.size[1])
    pixels = img.load()
    
    # 1. Background color detection
    edges = []
    for x in range(width):
        edges.append(pixels[x, 0])
        edges.append(pixels[x, height-1])
    for y in range(height):
        edges.append(pixels[0, y])
        edges.append(pixels[width-1, y])

    bg_color = Counter(edges).most_common(1)[0][0]
    
    # 2. Transparency processing
    tolerance = 80
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            dist = math.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
            if dist < tolerance:
                pixels[x, y] = (0, 0, 0, 0)
                
    alpha = img.getchannel('A')
    alpha_data = alpha.load()

    # 3. BFS (Find Connected Islands)
    visited: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    
    for y in range(height):
        for x in range(width):
            if alpha_data[x, y] > 0 and (x, y) not in visited: # type: ignore
                q: list[tuple[int, int]] = [(x, y)]
                visited.add((x, y))
                comp: list[tuple[int, int]] = []
                while len(q) > 0:
                    cx, cy = q.pop(0)
                    comp.append((cx, cy))
                    # Check 8 directions
                    for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (-1, -1), (1, -1), (-1, 1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if alpha_data[nx, ny] > 0 and (nx, ny) not in visited: # type: ignore
                                visited.add((nx, ny))
                                q.append((nx, ny))
                # Ignore tiny noise
                if len(comp) > 10:
                    components.append(comp)

    if not components:
        print("ERROR: No characters found.")
        return

    def get_center(comp: list[tuple[int, int]]) -> tuple[float, float]:
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        return (sum(xs)/len(xs), sum(ys)/len(ys))

    def get_bbox(comp: list[tuple[int, int]]) -> tuple[int, int, int, int]:
        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        return (min(xs), min(ys), max(xs), max(ys))

    class Cluster:
        comps: list[list[tuple[int, int]]]
        center: tuple[float, float]
        bbox: tuple[int, int, int, int]
        center_x: float
        center_y: float

        def __init__(self, comp: list[tuple[int, int]]):
            self.comps = [comp]
            self.center = get_center(comp)
            self.bbox = get_bbox(comp)
            self.center_x = self.center[0]
            self.center_y = self.center[1]

    # 4. Intelligent Core Clustering
    main_bodies: list[list[tuple[int, int]]] = [comp for comp in components if len(comp) > 500]
    small_parts: list[list[tuple[int, int]]] = [comp for comp in components if len(comp) <= 500]

    clusters: list[Cluster] = [Cluster(mb) for mb in main_bodies]

    # 小さいパーツを最も近い「本体」に吸収させるが、AIの「文字（Text）」はフィルタリングして除外する
    for sp in small_parts:
        sp_center = get_center(sp)
        sp_bbox = get_bbox(sp)
        sp_w = sp_bbox[2] - sp_bbox[0]
        sp_h = sp_bbox[3] - sp_bbox[1]
        
        best_cluster = None
        best_dist: float = float('inf')
        for c in clusters:
            if c is None: continue
            dist = math.sqrt((sp_center[0] - c.center[0])**2 + (sp_center[1] - c.center[1])**2)
            if dist < best_dist:
                best_dist = dist
                best_cluster = c
                
        if best_cluster is not None:
            # アンチ・テキスト フィルター（Anti-Text Filter）
            aspect = sp_w / max(1, sp_h)
            c_bbox = best_cluster.bbox
            c_bottom = c_bbox[3]
            c_center_y = best_cluster.center[1]
            
            # 本体の中央より下（足元寄り）にあるか
            is_below = sp_center[1] > c_center_y + (c_bottom - c_center_y) * 0.6 
            
            if is_below and sp_h < 25 and aspect > 1.5:
                continue
                
            best_cluster.comps.append(sp)
            b1 = best_cluster.bbox
            b2 = sp_bbox
            best_cluster.bbox = (min(b1[0], b2[0]), min(b1[1], b2[1]), max(b1[2], b2[2]), max(b1[3], b2[3]))
            
    # ゴミを除外
    valid_clusters = [c for c in clusters if sum(len(comp) for comp in c.comps) > 200]
    
    # 5. 上から下（行）、左から右（列）の順にキャラクターをソートする
    for c in valid_clusters:
        c.center_y = c.center[1]
        c.center_x = c.center[0]

    valid_clusters.sort(key=lambda c: c.center_y)
    
    rows: list[list[Cluster]] = []
    current_row: list[Cluster] = []
    last_y: float = -1.0
    for c in valid_clusters:
        if last_y < 0 or abs(c.center_y - last_y) < 60:
            current_row.append(c)
            last_y = sum(item.center_y for item in current_row) / len(current_row)
        else:
            rows.append(current_row)
            current_row = [c]
            last_y = c.center_y
    if current_row:
        rows.append(current_row)

    ordered_clusters: list[Cluster] = []
    for row in rows:
        row.sort(key=lambda c: c.center_x)
        ordered_clusters.extend(row)

    if len(ordered_clusters) >= expected_cols:
        ordered_clusters = ordered_clusters[:expected_cols]
    elif len(ordered_clusters) > 0:
        while len(ordered_clusters) < expected_cols:
            ordered_clusters.append(ordered_clusters[-1])

    # 6. 安全に画像抽出
    cell_images = []
    max_w = 0
    max_h = 0
    
    for cluster in ordered_clusters:
        c_min_x, c_min_y, c_max_x, c_max_y = cluster.bbox
        w_c = c_max_x - c_min_x + 1
        h_c = c_max_y - c_min_y + 1
        
        isolated_img = Image.new("RGBA", (w_c, h_c), (0, 0, 0, 0))
        iso_pixels = isolated_img.load()
        
        if iso_pixels is not None:
            for comp in cluster.comps:
                for (px, py) in comp:
                    iso_pixels[px - c_min_x, py - c_min_y] = pixels[px, py] # type: ignore
                
        cell_images.append(isolated_img)
        max_w = max(max_w, w_c)
        max_h = max(max_h, h_c)

    # 7. 全てのキャラを1列の画像に合成
    padding = 5
    final_cell_w = max_w + padding * 2
    final_cell_h = max_h + padding * 2
    
    out_img = Image.new("RGBA", (final_cell_w * expected_cols, final_cell_h), (0, 0, 0, 0))
    
    for c in range(expected_cols):
        content = cell_images[c]
        offset_x = (final_cell_w - content.size[0]) // 2
        offset_y = final_cell_h - content.size[1] - padding
        
        paste_x = (c * final_cell_w) + offset_x
        paste_y = offset_y
        
        out_img.paste(content, (paste_x, paste_y), content)

    out_img.save(dest, "PNG")
    print(f"Anti-Text Crop Success: {final_cell_w * expected_cols}x{final_cell_h} (Extracted {len(ordered_clusters)} chars)")

if __name__ == "__main__":
    if len(sys.argv) != 4:
         print("Usage: python crop_sprite.py <src_path> <dest_path> <cols>")
         sys.exit(1)
         
    src_path = sys.argv[1]
    dest_path = sys.argv[2]
    expected_cols = int(sys.argv[3])
    process_sprite(src_path, dest_path, expected_cols)
