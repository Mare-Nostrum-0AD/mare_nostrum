#!/bin/bash

# sets up parent repo, on a branch of the original 0ad repo, for developing mod
# allows you to rebase onto latest revisions on master branch
# usage: setup-parent.sh DEST_DIR []

child_dir="$(realpath "$(dirname "$0")/../")"
parent_dir="$(realpath "$1")"
mod_dir="${parent_dir}/binaries/data/mods/public"

git_base_file="${child_dir}/dev/git_base.txt"

oad_git_server='git@github.com:0ad/0ad.git'
if [[ $2 ]]; then
	git_base="$2"
elif [[ -f "${git_base_file}" ]]; then
	git_base="$(grep -m 1 -o -e '^commit \S\+' < "${git_base_file}" | cut -c8-)"
else
	git_base='master'
fi
[[ ! ${OAD_MOD_NAME} ]] && OAD_MOD_NAME='mare_nostrum'

oad_git_patch="${child_dir}/dev/mod.diff"

if [[ ! ${parent_dir} ]]; then
	echo "usage: $(dirname $0)) DEST_DIR [GIT_BASE]" >&2
	exit 1
fi

if [[ ! -d "${parent_dir}" ]]; then
	git clone $([[ "${git_base}" != 'master' ]] && echo --shallow-exclude="${git_base}" || echo --depth=1) "${oad_git_server}" "${parent_dir}"
fi

# setup new branch, save latest master commit to child dir dev files
cd "${parent_dir}"
git log -n 1 "${git_base}" > "${child_dir}/dev/git_base.txt"
git checkout "${git_base}"
git switch -c "${OAD_MOD_NAME}"

if [[ -f "${oad_git_patch}" ]]; then
	git apply "${oad_git_patch}"
else
	cd "${child_dir}"
	IFS=$'\n\r'
	for file in $(find . -type f | cut -c3- | grep -v -e '^\.git'); do
		dir="$(dirname "${file}")"
		mod_dirname="${mod_dir}/${dir}"
		[[ ! -d "${mod_dirname}" ]] && mkdir -p "${mod_dirname}"
		cp -f "${file}" "${mod_dir}/${file}"
	done
fi

cp -rf "${child_dir}/dev/parent" "${parent_dir}/dev"

echo "\
OAD_PARENT_DIR=\"${parent_dir}\"
OAD_MOD_DIR=\"${mod_dir}\"
OAD_CHILD_DIR=\"${child_dir}\"
OAD_GIT_BASE=\"${git_base}\"
OAD_GIT_BASE_FILE=\"${child_dir}/dev/git_base.txt\"
OAD_GIT_PATCH=\"${oad_git_patch}\"
" >> "${parent_dir}/dev/utils.sh"
